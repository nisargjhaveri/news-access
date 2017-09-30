# translate

This module takes care of the translation in the pipeline.

To add a new translator, you need to provide a function with signature `(text, from, to) => Promise`. The promise returned should resolve with the following object if successful. You need to add a reference in `index.js` once you define the function.
```
{
    "text": "...",
    "sentences": [
        {
            source: "...",
            target: "..."
        },
        ...
    ]
}
```
