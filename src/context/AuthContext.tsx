
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// IMPORTANT: Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = "103148999584-4e4s7645his87n8eis652dl741ge1c8c.apps.googleusercontent.com";
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
  const [gapiLoaded, setGapiLoaded] = useState(false);

  // Initialize the GSI client
  const initializeGsi = useCallback(() => {
    if (window.google) {
      window.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            tokenResponse.created_at = Date.now();
            localStorage.setItem('gdrive_token', JSON.stringify(tokenResponse));
            setIsSignedIn(true);
          }
        },
      });
      setGsiLoaded(true);
    }
  }, []);

  // Load GAPI client
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => window.gapi.load('client', () => setGapiLoaded(true));
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Initialize GSI when GAPI is loaded
  useEffect(() => {
    if (gapiLoaded) {
      initializeGsi();
    }
  }, [gapiLoaded, initializeGsi]);

  // Check for existing token on load
  useEffect(() => {
    const token = localStorage.getItem('gdrive_token');
    if (token) {
        const tokenData = JSON.parse(token);
        const expiresAt = (tokenData.created_at || 0) + (tokenData.expires_in || 0) * 1000;
        if (Date.now() < expiresAt) {
            setIsSignedIn(true);
        } else {
            localStorage.removeItem('gdrive_token');
        }
    }
  }, []);
  
  // Initialize One Tap sign-in
  useEffect(() => {
    if (gsiLoaded && !isSignedIn) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => {
           // This callback gives an ID token. We need an access token.
           // We will prompt for the access token scope if not already signed in.
           if (!isSignedIn) {
             signIn();
           }
        },
      });
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // console.log('One Tap prompt not shown or skipped');
        }
      });
    }
  }, [gsiLoaded, isSignedIn]);

  const signIn = () => {
    if (window.tokenClient) {
      window.tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  };

  const signOut = () => {
    const tokenItem = localStorage.getItem('gdrive_token');
    if (tokenItem) {
      const token = JSON.parse(tokenItem).access_token;
      if (token) {
        window.google.accounts.oauth2.revoke(token, () => {
          localStorage.removeItem('gdrive_token');
          setIsSignedIn(false);
        });
      }
    }
  };
  
  const getAccessToken = async (): Promise<string | null> => {
    const tokenItem = localStorage.getItem('gdrive_token');
    if (!tokenItem) return null;

    let tokenData = JSON.parse(tokenItem);
    
    // Refresh if token expires in less than 5 minutes
    const expiresAt = (tokenData.created_at || 0) + (tokenData.expires_in || 0) * 1000;
    if (Date.now() > expiresAt - 5 * 60 * 1000) {
        return new Promise((resolve) => {
            if (window.tokenClient) {
                // The callback in initTokenClient will handle the new token.
                // We just need to trigger the request.
                window.tokenClient.requestAccessToken({ prompt: '' });

                // Poll for the new token.
                const interval = setInterval(() => {
                    const newTokenItem = localStorage.getItem('gdrive_token');
                    if(newTokenItem) {
                        const newTokenData = JSON.parse(newTokenItem);
                        if (newTokenData.created_at > tokenData.created_at) {
                           clearInterval(interval);
                           resolve(newTokenData.access_token);
                        }
                    }
                }, 500);
                setTimeout(() => { // Timeout to prevent infinite loop
                    clearInterval(interval);
                    resolve(null);
                }, 10000);
            } else {
                resolve(null);
            }
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
