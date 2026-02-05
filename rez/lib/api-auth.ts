import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';
import { rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';

/**
 * Verifies the Firebase auth token from the request cookies
 * Returns the decoded token with user ID, or null if invalid
 */
export async function verifyAuthToken(request: NextRequest): Promise<{ uid: string; email?: string } | null> {
  try {
    const token = request.cookies.get('firebaseToken')?.value;
    
    if (!token) {
      return null;
    }

    const auth = getAuth(getApp('rezApp'));
    const decodedToken = await auth.verifyIdToken(token, true); // Check if token is revoked
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch (error: any) {
    // Log specific error types for debugging
    if (error?.code === 'auth/id-token-expired') {
      console.error('Auth token expired - client should refresh token');
    } else if (error?.code === 'auth/argument-error') {
      console.error('Invalid auth token format');
    } else {
      console.error('Error verifying auth token:', error);
    }
    return null;
  }
}

/**
 * Middleware helper to require authentication
 * Returns the authenticated user or a 401 response
 */
export async function requireAuth(request: NextRequest): Promise<
  | { uid: string; email?: string }
  | NextResponse<{ error: string }>
> {
  const user = await verifyAuthToken(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required' },
      { status: 401 }
    );
  }
  
  return user;
}

/**
 * Verifies that the authenticated user is a super admin
 * Returns the user data or a 403 response
 */
export async function requireSuperAdmin(request: NextRequest): Promise<
  | { uid: string; email?: string; isSuperAdmin: true }
  | NextResponse<{ error: string }>
> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { uid } = authResult;
  
  // Check if user is a super admin
  const adminDocRef = rezDB().collection(COLLECTIONS.TASK_MASTERS).doc(uid);
  const adminDoc = await adminDocRef.get();
  
  if (!adminDoc.exists) {
    return NextResponse.json(
      { error: 'Unauthorized: User not found' },
      { status: 403 }
    );
  }
  
  const adminData = adminDoc.data();
  if (adminData?.isSuperAdmin !== true) {
    return NextResponse.json(
      { error: 'Unauthorized: Super admin access required' },
      { status: 403 }
    );
  }
  
  return {
    ...authResult,
    isSuperAdmin: true as const,
  };
}

/**
 * Verifies that the authenticated user owns the resource (by email)
 * Used for task ownership verification
 */
export async function verifyResourceOwnership(
  request: NextRequest,
  resourceEmail: string
): Promise<boolean> {
  const user = await verifyAuthToken(request);
  
  if (!user) {
    return false;
  }
  
  // Check if the user's email matches the resource email
  return user.email === resourceEmail;
}

