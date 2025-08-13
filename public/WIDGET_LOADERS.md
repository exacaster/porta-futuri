# Widget Loader Files Documentation

This directory contains two widget loader scripts for different integration scenarios:

## widget-loader.js
**Use case:** When the host website already has React loaded or you want a smaller bundle.
- Expects React and ReactDOM to be available globally
- Smaller file size
- Best for sites already using React

## widget-loader-cdn.js  
**Use case:** For sites that don't have React installed.
- Automatically loads React and ReactDOM from CDN (unpkg)
- Handles dependency loading
- Best for non-React sites or simple HTML pages

## Integration Example

For sites without React:
```html
<script 
  src="https://your-domain.com/widget-loader-cdn.js"
  data-api-key="YOUR_API_KEY">
</script>
```

For sites with React:
```html
<script 
  src="https://your-domain.com/widget-loader.js"
  data-api-key="YOUR_API_KEY">
</script>
```

Both loaders will initialize the Porta Futuri widget with the same functionality.