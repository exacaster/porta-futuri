# Manual Test: Product Click Navigation

## Test Setup
1. Open the demo site at http://localhost:3002
2. Open the widget by clicking the chat button
3. Request product recommendations (e.g., "Show me some phones")

## Test Cases

### Test 1: Click on Product Card
**Steps:**
1. Once recommendations appear, hover over a product card
2. Verify the card lifts slightly and shows a shadow (hover effect)
3. Note the presence of the external link icon next to the product name
4. Click on the product card

**Expected Result:**
- If widget is in iframe: Parent window receives postMessage and navigates to /product/{id}
- If widget is standalone: Opens product page in new tab at http://localhost:3002/product/{id}
- Browser console should show no errors

### Test 2: Navigation Message Handling (Demo Site)
**Steps:**
1. Open browser developer console
2. Click on a product card in the widget
3. Check the console for any errors

**Expected Result:**
- Demo site should navigate to the product page
- URL should change to /product/{productId}
- No console errors

### Test 3: Product URL Configuration
**Verification:**
Check that the widget configuration supports:
- `navigation.productUrlPattern`: Custom URL pattern (default: "/product/{id}")
- `navigation.baseUrl`: Base URL for product links (default: "http://localhost:3002")
- `navigation.openInNewTab`: Whether to open in new tab (default: true)

## Visual Indicators
✅ Product cards should have:
- Cursor pointer on hover
- Lift animation on hover (translateY(-2px))
- Box shadow on hover
- External link icon next to product name

## Success Criteria
- [ ] Product cards are visually clickable
- [ ] Clicking navigates to correct product page
- [ ] No JavaScript errors in console
- [ ] Hover effects work smoothly
- [ ] Navigation works in both iframe and standalone modes