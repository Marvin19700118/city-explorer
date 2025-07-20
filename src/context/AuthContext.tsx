
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

  // Initialize the GSI client
  const initializeGsi = useCallback(() => {
    if (window.google && window.google.accounts) {
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
  
  // Load GSI script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGsi;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, [initializeGsi]);


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
            setIsSignedIn(false);
        }
    }
  }, []);
  
  const signIn = () => {
    if (window.tokenClient) {
      // Prompt the user to grant access.
      window.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        console.error("Token client not initialized");
    }
  };

  const signOut = () => {
    const tokenItem = localStorage.getItem('gdrive_token');
    if (tokenItem) {
      const token = JSON.parse(tokenItem).access_token;
      if (token && window.google && window.google.accounts) {
        window.google.accounts.oauth2.revoke(token, () => {
          localStorage.removeItem('gdrive_token');
          setIsSignedIn(false);
        });
      } else {
        // Fallback if token or google api is not available
        localStorage.removeItem('gdrive_token');
        setIsSignedIn(false);
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
        return new Promise((resolve, reject) => {
            if (window.tokenClient) {
                // The callback in initTokenClient will handle saving the new token.
                window.tokenClient.requestAccessToken({ prompt: '' });

                // Poll for the new token, as the callback is asynchronous.
                const interval = setInterval(() => {
                    const newTokenItem = localStorage.getItem('gdrive_token');
                    if(newTokenItem) {
                        const newTokenData = JSON.parse(newTokenItem);
                        // Check if the new token is different from the old one
                        if (newTokenData.access_token !== tokenData.access_token) {
                           clearInterval(interval);
                           resolve(newTokenData.access_token);
                        }
                    }
                }, 500);

                // Timeout to prevent an infinite loop in case of an issue
                setTimeout(() => { 
                    clearInterval(interval);
                    reject(new Error("Token refresh timeout"));
                }, 10000);
            } else {
                reject(new Error("Token client not initialized for refresh"));
            }
        });
    }
    
    return tokenData.access_token || null;
  }

  return (
    <AuthContext.Provider value={{ isSignedIn, signIn, signOut, getAccessToken, gsiLoaded }}>
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
