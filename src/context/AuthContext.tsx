
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// IMPORTANT: Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

interface AuthContextType {
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

declare global {
  interface Window {
    google: any;
    gapi: any;
    tokenClient: any;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [gsiLoaded, setGsiLoaded] = useState(false);

  const initializeGsi = useCallback(() => {
    if (window.google) {
      window.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            localStorage.setItem('gdrive_token', JSON.stringify(tokenResponse));
            setIsSignedIn(true);
          }
        },
      });
      setGsiLoaded(true);
    }
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => window.gapi.load('client', initializeGsi);
    document.body.appendChild(script);

    // Check for existing token on load
    const token = localStorage.getItem('gdrive_token');
    if (token) {
        const tokenData = JSON.parse(token);
        if (new Date().getTime() < tokenData.expires_in * 1000 + (tokenData.created_at || Date.now())) {
            setIsSignedIn(true);
        } else {
            localStorage.removeItem('gdrive_token');
        }
    }
    
    return () => {
      document.body.removeChild(script);
    };

  }, [initializeGsi]);
  
  useEffect(() => {
    // This handles the One Tap sign-in response
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => {
           // This callback is for the ID token, but we need the access token for Drive.
           // We'll trigger the access token flow instead.
           signIn();
        },
      });
    }
  }, [gsiLoaded]);

  const signIn = () => {
    if (window.tokenClient) {
      window.tokenClient.requestAccessToken();
    }
  };

  const signOut = () => {
    const token = localStorage.getItem('gdrive_token');
    if (token) {
      window.google.accounts.oauth2.revoke(JSON.parse(token).access_token, () => {
        localStorage.removeItem('gdrive_token');
        setIsSignedIn(false);
      });
    }
  };
  
  const getAccessToken = async (): Promise<string | null> => {
    let tokenData = JSON.parse(localStorage.getItem('gdrive_token') || '{}');
    
    // Check if token is expired
    // The expiry time is usually 3600 seconds (1 hour). We'll check if it's close to expiring.
    const now = Date.now();
    const createdAt = tokenData.created_at || 0;
    const expiresIn = (tokenData.expires_in || 0) * 1000;
    
    if (now > createdAt + expiresIn - 5 * 60 * 1000) { // Refresh if less than 5 mins left
        return new Promise((resolve) => {
            window.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: DRIVE_SCOPE,
                callback: (tokenResponse: any) => {
                  if (tokenResponse && tokenResponse.access_token) {
                    tokenResponse.created_at = Date.now();
                    localStorage.setItem('gdrive_token', JSON.stringify(tokenResponse));
                    setIsSignedIn(true);
                    resolve(tokenResponse.access_token);
                  } else {
                    resolve(null);
                  }
                },
              });
            window.tokenClient.requestAccessToken();
        });
    }
    
    return tokenData.access_token || null;
  }

  return (
    <AuthContext.Provider value={{ isSignedIn, signIn, signOut, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
