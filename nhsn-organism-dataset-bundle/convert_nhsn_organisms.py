#!/usr/bin/env python3
"""Convert the NHSN organism XLSX workbook into application-ready JSON.

Uses only Python's standard library.

Usage:
    python scripts/convert_nhsn_organisms.py \
        data/nhsn/source/master-organism-com-commensals-lists.xlsx \
        data/nhsn/nhsn-organisms.json
"""

from __future__ import annotations

import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
NS = {"main": MAIN_NS, "rel": REL_NS, "pkgrel": PKG_REL_NS}


def column_index(cell_reference: str) -> int:
    match = re.match(r"([A-Z]+)", cell_reference)
    if not match:
        raise ValueError(f"Invalid cell reference: {cell_reference}")

    value = 0
    for character in match.group(1):
        value = value * 26 + (ord(character) - 64)
    return value - 1


def normalize_name(value: str) -> str:
    value = value.lower().replace(".", "").replace("-", " ")
    return re.sub(r"\s+", " ", value).strip()


def read_combined_rows(workbook_path: Path) -> list[list[str | None]]:
    with zipfile.ZipFile(workbook_path) as archive:
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for shared_item in root.findall("main:si", NS):
                text_parts = [
                    node.text or ""
                    for node in shared_item.findall(".//main:t", NS)
                ]
                shared_strings.append("".join(text_parts))

        workbook_root = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships_root = ET.fromstring(
            archive.read("xl/_rels/workbook.xml.rels")
        )
        relationship_map = {
            relationship.attrib["Id"]: relationship.attrib["Target"]
            for relationship in relationships_root.findall(
                "pkgrel:Relationship", NS
            )
        }

        combined_target = None
        for sheet in workbook_root.findall("main:sheets/main:sheet", NS):
            if sheet.attrib["name"] == "Combined":
                relationship_id = sheet.attrib[f"{{{REL_NS}}}id"]
                combined_target = relationship_map[relationship_id]
                break

        if not combined_target:
            raise RuntimeError("The workbook does not contain a Combined sheet.")

        sheet_path = "xl/" + combined_target.lstrip("/")
        sheet_root = ET.fromstring(archive.read(sheet_path))

        rows: list[list[str | None]] = []
        for row_element in sheet_root.findall(
            ".//main:sheetData/main:row", NS
        ):
            row_number = int(row_element.attrib["r"])
            if row_number < 4:
                continue

            values: list[str | None] = [None] * 5
            for cell in row_element.findall("main:c", NS):
                index = column_index(cell.attrib["r"])
                if index >= 5:
                    continue

                cell_type = cell.attrib.get("t")
                value_node = cell.find("main:v", NS)

                if value_node is None:
                    inline_node = cell.find("main:is/main:t", NS)
                    value = inline_node.text if inline_node is not None else None
                elif cell_type == "s":
                    value = shared_strings[int(value_node.text)]
                else:
                    value = value_node.text

                values[index] = value

            if values[0]:
                rows.append(values)

        return rows


def convert(workbook_path: Path) -> dict:
    organisms = []

    for row in read_combined_rows(workbook_path):
        nhsn_code, category, display_name, snomed_term, snomed_code = row
        category = category or ""
        category_parts = {
            part.strip().upper()
            for part in category.split("/")
            if part.strip()
        }
        display_name = display_name.strip() if display_name else None

        organisms.append(
            {
                "nhsnCode": nhsn_code.strip(),
                "nhsnOrganismCategory": category.strip(),
                "displayName": display_name,
                "snomedPreferredTerm": (
                    snomed_term.strip() if snomed_term else None
                ),
                "snomedCode": snomed_code.strip() if snomed_code else None,
                "isCommonCommensal": "CC" in category_parts,
                "isMbiOrganism": "MBI" in category_parts,
                "isUtiBacterium": "UTI" in category_parts,
                "isOnAllOrganismsList": "ALL" in category_parts,
                "pathogenClassification": (
                    "common_commensal"
                    if "CC" in category_parts
                    else "recognized_pathogen_candidate"
                ),
                "normalizedDisplayName": (
                    normalize_name(display_name) if display_name else None
                ),
            }
        )

    return {
        "metadata": {
            "datasetName": (
                "NHSN Master Organism and Common Commensals Lists"
            ),
            "sourceWorkbook": workbook_path.name,
            "sourceSheet": "Combined",
            "generatedOn": date.today().isoformat(),
            "recordCount": len(organisms),
            "classificationNote": (
                "recognized_pathogen_candidate means the organism is not "
                "marked CC in this workbook. Apply NHSN event-specific "
                "exclusions and criteria before final classification."
            ),
            "unmatchedOrganismRule": (
                "Do not automatically classify an organism absent from this "
                "dataset. Return unresolved and require manual NHSN review."
            ),
        },
        "organisms": organisms,
    }


def main() -> int:
    if len(sys.argv) not in (2, 3):
        print(
            "Usage: convert_nhsn_organisms.py INPUT.xlsx [OUTPUT.json]",
            file=sys.stderr,
        )
        return 2

    input_path = Path(sys.argv[1])
    output_path = (
        Path(sys.argv[2])
        if len(sys.argv) == 3
        else Path("nhsn-organisms.json")
    )

    if not input_path.exists():
        print(f"Input file not found: {input_path}", file=sys.stderr)
        return 1

    result = convert(input_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(result, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(
        f"Wrote {result['metadata']['recordCount']:,} organisms "
        f"to {output_path}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
