from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create the FastAPI app
# This is like creating your "server"
app = FastAPI(title="Kinetic API")

# CORS = Cross-Origin Resource Sharing
# This allows your React app (running on port 5173) to talk to your API (running on port 8000)
# Without this, browsers block requests between different ports for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your React app's URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# This is an "endpoint" or "route"
# When someone visits http://localhost:8000/ they'll get this response
@app.get("/")
def read_root():
    return {"message": "Welcome to Kinetic API"}

# Another endpoint for checking if the server is running
@app.get("/health")
def health_check():
    return {"status": "healthy"}