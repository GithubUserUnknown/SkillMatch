import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';

const supabaseUrl = 'https://ynqahslykouwvnowcazp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWFoc2x5a291d3Zub3djYXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzE4MDQsImV4cCI6MjA2NzkwNzgwNH0.GHYYhmDCw-yLnirPSTUzZcPc_QaOjkqjfnbvAmq4W-8';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Upload a file to Supabase Storage
 * @param filePath - Local file path to upload
 * @param storagePath - Path in Supabase storage (e.g., 'user-id/resume-id.pdf')
 * @param bucket - Storage bucket name (default: 'resume-files')
 * @returns Public URL of the uploaded file
 */
export async function uploadFileToStorage(
  filePath: string,
  storagePath: string,
  bucket: string = 'resume-files'
): Promise<string> {
  try {
    // Read the file
    const fileBuffer = await fs.readFile(filePath);
    
    // Determine content type based on file extension
    const contentType = storagePath.endsWith('.pdf') 
      ? 'application/pdf' 
      : storagePath.endsWith('.tex')
      ? 'text/plain'
      : 'application/octet-stream';

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true, // Overwrite if exists
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading file to storage:', error);
    throw error;
  }
}

/**
 * Download a file from Supabase Storage
 * @param storagePath - Path in Supabase storage
 * @param bucket - Storage bucket name (default: 'resume-files')
 * @returns File buffer
 */
export async function downloadFileFromStorage(
  storagePath: string,
  bucket: string = 'resume-files'
): Promise<Buffer> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(storagePath);

    if (error) {
      console.error('Supabase storage download error:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }

    // Convert Blob to Buffer
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error downloading file from storage:', error);
    throw error;
  }
}

/**
 * Delete a file from Supabase Storage
 * @param storagePath - Path in Supabase storage
 * @param bucket - Storage bucket name (default: 'resume-files')
 */
export async function deleteFileFromStorage(
  storagePath: string,
  bucket: string = 'resume-files'
): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([storagePath]);

    if (error) {
      console.error('Supabase storage delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting file from storage:', error);
    throw error;
  }
}

/**
 * Get public URL for a file in Supabase Storage
 * @param storagePath - Path in Supabase storage
 * @param bucket - Storage bucket name (default: 'resume-files')
 * @returns Public URL
 */
export function getPublicUrl(
  storagePath: string,
  bucket: string = 'resume-files'
): string {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath);
  
  return publicUrl;
}

