# Porta Futuri AI Add-On

An intelligent, embeddable product recommendation widget that uses AI to provide personalized shopping suggestions based on customer data and browsing behavior.

## Features

- **AI-Powered Recommendations**: Uses Claude (Anthropic) with GPT-4 fallback for intelligent product suggestions
- **Simple Integration**: Single-line JavaScript embed code
- **CSV Data Sources**: Works with product catalogs, customer profiles, and browsing context from CSV files
- **Privacy-First**: No persistent storage of customer data
- **Real-Time Processing**: Sub-3 second response time for recommendations
- **Lightweight**: < 50KB compressed widget bundle
- **Customizable**: Flexible theming and positioning options
- **Responsive**: Works on desktop, tablet, and mobile devices

## Quick Start

### 1. Prerequisites

- Node.js 18+ and npm 9+
- Supabase account (for backend)
- Anthropic API key (for Claude)
- OpenAI API key (optional, for fallback)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/your-org/porta-futuri.git
cd porta-futuri

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your .env file with your API keys
```

### 3. Development Setup

```bash
# Start Supabase locally
npm run supabase:start

# Run database migrations
npm run supabase:migrate

# Start development server
npm run dev
```

### 4. Widget Integration

Add the widget to any website with a single line of code:

```html
<script 
  src="https://your-domain.com/widget.js" 
  data-api-key="YOUR_API_KEY"
  data-position="bottom-right"
  data-product-catalog-url="/data/products.csv"
  data-customer-profile-url="/data/customer.csv"
  data-context-url="/data/context.csv">
</script>
```

Or initialize programmatically:

```javascript
window.PortaFuturi.init({
  apiKey: 'YOUR_API_KEY',
  position: 'bottom-right',
  theme: {
    primaryColor: '#3B82F6',
    fontFamily: 'Inter, sans-serif'
  },
  data: {
    productCatalogUrl: '/data/products.csv',
    customerProfileUrl: '/data/customer.csv',
    contextUrl: '/data/context.csv'
  }
});
```

## CSV Data Formats

### Product Catalog (products.csv)
```csv
product_id,name,category,subcategory,brand,price,description,stock_status,image_url,ratings,review_count
PROD001,iPhone 15,Electronics,Smartphones,Apple,999,Latest iPhone model,in_stock,https://...,4.5,1250
```

### Customer Profile (customer.csv)
```csv
customer_id,age_group,gender,location,segment,lifetime_value,preferences
CUST123,25-34,F,New York,Premium,5000,"Electronics,Fashion"
```

### Context Events (context.csv)
```csv
timestamp,event_type,product_id,category_viewed,search_query,session_id
2024-01-20T10:30:00Z,product_view,PROD001,Electronics,,SESSION123
2024-01-20T10:31:00Z,search,,,iPhone cases,SESSION123
```

## Configuration

### Environment Variables

See `.env.example` for all available configuration options. Key variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `ANTHROPIC_API_KEY`: Claude API key
- `OPENAI_API_KEY`: OpenAI API key (optional)
- `VITE_API_URL`: API endpoint URL

### Widget Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | required | Your API key |
| `position` | string | 'bottom-right' | Widget position |
| `theme` | object | {} | Custom theme settings |
| `data` | object | {} | CSV data source URLs |

## Development

### Project Structure

```
porta-futuri/
├── src/
│   ├── widget/          # React widget code
│   ├── api/             # Backend API code
│   └── shared/          # Shared types and utilities
├── supabase/
│   └── functions/       # Edge Functions
├── tests/               # Test files
└── PRPs/                # Product requirement documents
```

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run test             # Run tests
npm run lint             # Lint code
npm run typecheck        # Type checking
npm run format           # Format code
```

### Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Check coverage
npm run test:coverage
```

## API Reference

### Endpoints

#### POST /functions/v1/recommendations
Get AI-powered product recommendations.

**Request:**
```json
{
  "session_id": "SESSION123",
  "query": "I need a new phone",
  "context": {
    "current_page": "/electronics",
    "cart_items": ["PROD002"]
  },
  "customer_data": {
    "csv_hash": "abc123",
    "profile_loaded": true,
    "context_loaded": true
  }
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "product_id": "PROD001",
      "name": "iPhone 15",
      "price": 999,
      "reasoning": "Based on your interest in premium electronics",
      "match_score": 95
    }
  ],
  "message": "Here are my top recommendations for you",
  "response_time": 1250,
  "cache_hit": false
}
```

### Rate Limiting

- Default: 100 requests per minute per API key
- Headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Deployment

### Production Build

```bash
# Build widget for production
npm run build:widget

# Build API functions
npm run build:api

# Deploy to Supabase
npm run supabase:deploy
```

### CDN Setup

1. Upload the built widget file to your CDN
2. Configure CORS headers to allow embedding
3. Set up SSL certificate for HTTPS delivery

## Performance

- **Widget Load Time**: < 500ms
- **Initial Recommendations**: < 3 seconds (P95)
- **Bundle Size**: < 50KB compressed
- **CSV Processing**: < 1 second per file
- **Cache TTL**: 15 minutes

## Security

- TLS 1.3 for all communications
- API key authentication
- Rate limiting per key
- CORS protection
- Input sanitization
- No persistent PII storage

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Widget Not Loading
- Check API key validity
- Verify CORS settings
- Check browser console for errors

### Slow Recommendations
- Verify CSV file sizes (< 50MB)
- Check network latency
- Review product catalog size (< 10,000 items)

### CSV Parse Errors
- Ensure UTF-8 encoding
- Check for required fields
- Validate date formats

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Documentation: https://docs.portafuturi.com
- Issues: https://github.com/your-org/porta-futuri/issues
- Email: support@portafuturi.com

---

Built with ❤️ by Porta Futuri Team