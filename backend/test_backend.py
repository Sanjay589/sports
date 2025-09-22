#!/usr/bin/env python3
"""
Simple test script to verify the backend is working correctly.
Run this after starting the Flask server to test the health endpoint.
"""

import requests
import json

def test_health_endpoint():
    """Test the health check endpoint"""
    try:
        response = requests.get('http://localhost:5000/health')
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend is healthy!")
            print(f"Status: {data.get('status')}")
            print(f"Message: {data.get('message')}")
            return True
        else:
            print(f"❌ Health check failed with status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on port 5000")
        return False
    except Exception as e:
        print(f"❌ Error testing backend: {e}")
        return False

def test_upload_endpoint():
    """Test the upload endpoint (without actual video)"""
    try:
        # Test with empty data to see if endpoint exists
        response = requests.post('http://localhost:5000/upload-video')
        if response.status_code == 400:
            print("✅ Upload endpoint is accessible (returns 400 for missing video - expected)")
            return True
        else:
            print(f"⚠️  Upload endpoint returned unexpected status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to upload endpoint")
        return False
    except Exception as e:
        print(f"❌ Error testing upload endpoint: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing SAP - AI Sports Analysis Backend")
    print("=" * 40)
    
    print("\n1. Testing health endpoint...")
    health_ok = test_health_endpoint()
    
    print("\n2. Testing upload endpoint...")
    upload_ok = test_upload_endpoint()
    
    print("\n" + "=" * 40)
    if health_ok and upload_ok:
        print("🎉 All tests passed! Backend is ready for mobile app integration.")
        print("\nNext steps:")
        print("1. Update the BACKEND_URL in your mobile app")
        print("2. Start the mobile app with 'npm start'")
        print("3. Test video recording and analysis!")
    else:
        print("❌ Some tests failed. Check the backend logs for errors.")
