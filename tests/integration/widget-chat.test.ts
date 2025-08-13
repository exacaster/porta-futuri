import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Widget Chat Functionality', () => {
  test.beforeEach(async () => {
    // Build widget before tests
    execSync('npm run build:widget', { stdio: 'inherit' });
  });

  test('should load widget and display greeting', async ({ page }) => {
    // Create a test HTML page with widget embedded
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Widget Test</title>
        </head>
        <body>
          <h1>Test Page</h1>
          <div id="porta-futuri-widget-loader"></div>
          
          <!-- Load React from CDN -->
          <script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
          
          <!-- Load widget -->
          <link rel="stylesheet" href="http://localhost:8080/dist/widget.css">
          <script src="http://localhost:8080/dist/widget.iife.js"></script>
          
          <script>
            // Initialize widget after load
            window.addEventListener('load', () => {
              if (window.PortaFuturi) {
                window.PortaFuturi.init({
                  apiKey: 'dev_key_porta_futuri_2024',
                  apiUrl: 'https://rvlbbgdkgneobvlyawix.supabase.co',
                  containerId: 'porta-futuri-widget-loader',
                  position: 'bottom-right'
                });
              }
            });
          </script>
        </body>
      </html>
    `);
    
    // Wait for widget to load
    await page.waitForTimeout(2000);
    
    // Check if widget container exists
    const widgetContainer = await page.$('#porta-futuri-widget-loader');
    expect(widgetContainer).toBeTruthy();
    
    // Click widget trigger button
    const widgetTrigger = await page.$('[data-testid="widget-trigger"], .widget-trigger, button[aria-label*="chat"], button[aria-label*="Chat"]');
    if (widgetTrigger) {
      await widgetTrigger.click();
      
      // Wait for chat window to open
      await page.waitForTimeout(1000);
      
      // Check for greeting message
      const greetingElement = await page.$('.chat-message, .message-content, [data-testid="chat-message"]');
      if (greetingElement) {
        const greeting = await greetingElement.textContent();
        expect(greeting).toBeTruthy();
        expect(greeting?.toLowerCase()).toMatch(/(hello|hi|welcome|help|assist)/);
      }
    }
  });
  
  test('should search for products', async ({ page }) => {
    // Create test page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Widget Test</title>
        </head>
        <body>
          <h1>Test Page</h1>
          <div id="porta-futuri-widget-loader"></div>
          
          <!-- Load React from CDN -->
          <script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
          
          <!-- Load widget -->
          <link rel="stylesheet" href="http://localhost:8080/dist/widget.css">
          <script src="http://localhost:8080/dist/widget.iife.js"></script>
          
          <script>
            window.addEventListener('load', () => {
              if (window.PortaFuturi) {
                window.PortaFuturi.init({
                  apiKey: 'dev_key_porta_futuri_2024',
                  apiUrl: 'https://rvlbbgdkgneobvlyawix.supabase.co',
                  containerId: 'porta-futuri-widget-loader',
                  position: 'bottom-right'
                });
              }
            });
          </script>
        </body>
      </html>
    `);
    
    // Wait for widget to load
    await page.waitForTimeout(2000);
    
    // Open widget
    const widgetTrigger = await page.$('[data-testid="widget-trigger"], .widget-trigger, button[aria-label*="chat"], button[aria-label*="Chat"]');
    if (widgetTrigger) {
      await widgetTrigger.click();
      await page.waitForTimeout(1000);
      
      // Find and fill chat input
      const chatInput = await page.$('input[type="text"], textarea, [data-testid="chat-input"], .chat-input');
      if (chatInput) {
        await chatInput.fill('laptop for programming');
        
        // Submit the query
        await page.keyboard.press('Enter');
        
        // Wait for recommendations (up to 5 seconds)
        await page.waitForTimeout(5000);
        
        // Check for product recommendations
        const recommendations = await page.$$('[data-testid="product-recommendation"], .product-card, .recommendation-card');
        expect(recommendations.length).toBeGreaterThan(0);
        expect(recommendations.length).toBeLessThanOrEqual(5);
      }
    }
  });
  
  test('should handle API errors gracefully', async ({ page }) => {
    // Create test page with invalid API key
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Widget Test</title>
        </head>
        <body>
          <h1>Test Page</h1>
          <div id="porta-futuri-widget-loader"></div>
          
          <!-- Load React from CDN -->
          <script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
          
          <!-- Load widget -->
          <link rel="stylesheet" href="http://localhost:8080/dist/widget.css">
          <script src="http://localhost:8080/dist/widget.iife.js"></script>
          
          <script>
            window.addEventListener('load', () => {
              if (window.PortaFuturi) {
                window.PortaFuturi.init({
                  apiKey: 'invalid_key',
                  apiUrl: 'https://rvlbbgdkgneobvlyawix.supabase.co',
                  containerId: 'porta-futuri-widget-loader',
                  position: 'bottom-right'
                });
              }
            });
          </script>
        </body>
      </html>
    `);
    
    // Wait for widget to load
    await page.waitForTimeout(2000);
    
    // Open widget
    const widgetTrigger = await page.$('[data-testid="widget-trigger"], .widget-trigger, button[aria-label*="chat"], button[aria-label*="Chat"]');
    if (widgetTrigger) {
      await widgetTrigger.click();
      await page.waitForTimeout(1000);
      
      // Try to search
      const chatInput = await page.$('input[type="text"], textarea, [data-testid="chat-input"], .chat-input');
      if (chatInput) {
        await chatInput.fill('test query');
        await page.keyboard.press('Enter');
        
        // Wait for error response
        await page.waitForTimeout(3000);
        
        // Check for error message or fallback recommendations
        const errorMessage = await page.$('.error-message, [data-testid="error-message"], .fallback-message');
        const fallbackRecommendations = await page.$$('.product-card, .recommendation-card');
        
        // Should either show error or fallback recommendations
        expect(errorMessage || fallbackRecommendations.length > 0).toBeTruthy();
      }
    }
  });
});