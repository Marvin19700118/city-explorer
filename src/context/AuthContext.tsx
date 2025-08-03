
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const GOOGLE_CLIENT_ID = "103148999584-4e4s7645his87n8eis652dl741ge1c8c.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";

interface AuthContextType {
  isSignedIn: boolean;
  signOut: () => void;
  getAccessToken: () => Promise<string | null>;
  gsiLoaded: boolean;
  tokenClient: any;
}

const AuthContext = createContext<AuthContextType | null>(null);

declare global {
  interface Window {
    google: any;
    tokenClient: any;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);

  const initializeGsi = useCallback(() => {
    if (window.google && window.google.accounts) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        redirect_uri: window.location.origin, // Explicitly set the redirect URI
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            tokenResponse.created_at = Date.now();
            localStorage.setItem('gdrive_token', JSON.stringify(tokenResponse));
            setIsSignedIn(true);
          }
        },
      });
      setTokenClient(client);
      setGsiLoaded(true);
    }
  }, []);
  
  useEffect(() => {
    const script = document.getElementById('gsi-client-script');
    if (script && window.google) {
        initializeGsi();
    } else if (!script) {
        const newScript = document.createElement('script');
        newScript.id = 'gsi-client-script';
        newScript.src = 'https://accounts.google.com/gsi/client';
        newScript.async = true;
        newScript.defer = true;
        newScript.onload = initializeGsi;
        document.body.appendChild(newScript);
    }
  }, [initializeGsi]);


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

  const signOut = () => {
    const tokenItem = localStorage.getItem('gdrive_token');
    if (tokenItem) {
      const token = JSON.parse(tokenItem).access_token;
      if (token && window.google && window.google.accounts && window.google.accounts.oauth2) {
        window.google.accounts.oauth2.revoke(token, () => {
          // Callback after revocation
        });
      }
    }
    localStorage.removeItem('gdrive_token');
    setIsSignedIn(false);
  };
  
  const getAccessToken = async (): Promise<string | null> => {
    const tokenItem = localStorage.getItem('gdrive_token');
    if (!tokenItem) return null;

    let tokenData = JSON.parse(tokenItem);
    
    // Refresh if token expires in less than 5 minutes
    const expiresAt = (tokenData.created_at || 0) + (tokenData.expires_in || 0) * 1000;
    if (Date.now() > expiresAt - 5 * 60 * 1000) {
        return new Promise((resolve, reject) => {
            if (tokenClient) {
                // The callback in initTokenClient will handle saving the new token.
                const originalCallback = tokenClient.callback;
                tokenClient.callback = (tokenResponse: any) => {
                    originalCallback(tokenResponse); // Call original callback
                    if (tokenResponse && tokenResponse.access_token) {
                       resolve(tokenResponse.access_token);
                    } else {
                       reject(new Error("Token refresh failed."));
                    }
                };
                tokenClient.requestAccessToken({ prompt: '' });
            } else {
                reject(new Error("Token client not initialized for refresh"));
            }
        });
    }
    
    return tokenData.access_token || null;
  }

  return (
    <AuthContext.Provider value={{ isSignedIn, signOut, getAccessToken, gsiLoaded, tokenClient }}>
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
