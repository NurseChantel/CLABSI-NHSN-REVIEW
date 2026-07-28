# Upload these files to your existing GitHub repository

After downloading and extracting the ZIP, upload the following items into the **root of your existing repository**:

```text
data/
  organisms.json

src/
  organism-search.js

APP_JS_INTEGRATION.js
UPLOAD_INSTRUCTIONS.md
```

## Do not overwrite

Do **not** replace your existing:

- `index.html`
- `app.js`
- `style.css`

`APP_JS_INTEGRATION.js` is an instruction/snippet file. Use it to connect the database to your existing `app.js`.

## GitHub upload steps

1. Download and extract the ZIP on your computer.
2. In GitHub, click **Add file → Upload files**.
3. Drag the extracted `data` folder, `src` folder, and the two instruction files into the upload area.
4. Commit the upload.
5. Ask Codex to integrate `APP_JS_INTEGRATION.js` into your existing `app.js` without removing current calculator behavior.

## Important limitation

The included `organisms.json` is the working database format, but currently contains only a small starter set. It is not yet a complete NHSN-validated organism database.
