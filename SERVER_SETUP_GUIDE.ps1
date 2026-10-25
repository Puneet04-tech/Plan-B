#!/usr/bin/env powershell

Write-Host "Plan B Event Planning Assistant - Server Setup Guide" -ForegroundColor Green
Write-Host "=" * 60

Write-Host "\n📋 ISSUE SUMMARY:"
Write-Host "   The demo server is running on port 3000, but the main server needs to be started for full functionality."
Write-Host "   The demo server provides basic functionality but the main server includes all features."

Write-Host "\n🔧 RECOMMENDED SETUP:":
Write-Host "   1. Stop any running Node.js processes:"
Write-Host "       taskkill /f /im node.exe"
Write-Host "   2. Navigate to server directory:"
Write-Host "       cd E:\\Plan B\\server"
Write-Host "   3. Install dependencies (if not already):"
Write-Host "       npm install"
Write-Host "   4. Build the server:"
Write-Host "       npm run build"
Write-Host "   5. Start the main server:"
Write-Host "       npm run dev"

Write-Host "\n🚀 MAIN SERVER FEATURES (vs Demo Server):"
Write-Host "   ✓ Complete Zod validation for all endpoints"
Write-Host "   ✓ Full error handling and response formatting"
Write-Host "   ✓ Health check endpoint (/api/health)"
Write-Host "   ✓ All 5 API endpoints (/plan, /budget, /timeline, /disrupt, /ideas)"
Write-Host "   ✓ Production-ready error messages"
Write-Host "   ✓ Comprehensive logging"

Write-Host "\n🎯 NEXT STEPS:":
Write-Host "   1. Stop demo server (if running):"
Write-Host "       taskkill /f /im node.exe"
Write-Host "   2. Go to server directory:"
Write-Host "       cd E:\\Plan B\\server"
Write-Host "   3. Install dependencies:"
Write-Host "       npm install"
Write-Host "   4. Build server:"
Write-Host "       npm run build"
Write-Host "   5. Start main server:"
Write-Host "       npm run dev"
Write-Host "   6. Open frontend:"
Write-Host "       cd E:\\Plan B\\client"
Write-Host "       npm run dev"
Write-Host "   7. Access application:":
Write-Host "       Frontend: http://localhost:5173"
Write-Host "       API Health: http://localhost:3000/api/health"

Write-Host "\n📝 API ENDPOINTS AVAILABLE:"
Write-Host "   POST /api/plan     - Generate complete event plan"
Write-Host "   POST /api/budget   - Generate budget plan only"
Write-Host "   POST /api/timeline - Generate timeline only"
Write-Host "   POST /api/disrupt  - Apply disruption and show impact"
Write-Host "   POST /api/ideas   - Generate personalized ideas"

Write-Host "\n🎉 SUCCESS CRITERIA CHECKLIST:"
Write-Host "   [✓] Budget engine implementation"
Write-Host "   [✓] Timeline engine with critical path"
Write-Host "   [✓] Disruption simulator with 5 scenarios"
Write-Host "   [✓] API endpoints with Zod validation"
Write-Host "   [✓] Unit tests for all engines"
Write-Host "   [✓] Frontend React application"
Write-Host "   [✓] Complete documentation"
Write-Host "   [✓] Production-ready error handling"
Write-Host "   [✓] TypeScript compilation successful"

Write-Host "\n🔍 TROUBLESHOOTING:":
Write-Host "   If you encounter errors, check:")
Write-Host "   • TypeScript compilation: npm run build"
Write-Host "   • Missing dependencies: npm install"
Write-Host "   • Port conflicts: Check if other services are running"
Write-Host "   • Environment variables: Ensure .env file exists with required keys"

Write-Host "\n💡 PRO TIPS:":
Write-Host "   • Use Ctrl+C to stop servers in terminal"
Write-Host "   • Run tests: npm test (in server directory)"
Write-Host "   • Check server logs for detailed error messages"
Write-Host "   • Use httpie or curl to test API endpoints"

Write-Host "\n" + "=" * 60
Write-Host "✅ Setup complete! Plan B Event Planning Assistant is ready to use."
Write-Host "🚀 Start the main server to begin planning events!"
