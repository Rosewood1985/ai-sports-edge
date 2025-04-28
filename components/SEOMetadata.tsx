import React from 'react';
import { Platform, View } from 'react-native';
import { useI18n } from '../contexts/I18nContext';

// Conditionally import Helmet only on web
let Helmet: any = () => <View />;
if (Platform.OS === 'web') {
  try {
    // Dynamic import for web only
    Helmet = require('react-helmet').Helmet;
  } catch (error) {
    console.warn('react-helmet is not available. SEO features will be disabled.');
  }
}

interface SEOMetadataProps {
  titleKey: string;
  descriptionKey: string;
  path: string;
  imageUrl?: string;
  keywords?: string[];
}

/**
 * SEOMetadata component
 * 
 * This component handles SEO-related metadata for web platforms.
 * It adds title, description, canonical URL, Open Graph tags, Twitter card tags, and hreflang tags.
 * 
 * Note: This component only works on web platforms and has no effect on native apps.
 */
export const SEOMetadata: React.FC<SEOMetadataProps> = ({
  titleKey,
  descriptionKey,
  path,
  imageUrl,
  keywords = [],
}) => {
  const { t, language } = useI18n();
  
  // Only render on web platform
  if (Platform.OS !== 'web') {
    return null;
  }
  
  // Base URL for the website
  const baseUrl = 'https://ai-sports-edge.com';
  
  // Canonical URL for the current page
  const canonicalUrl = `${baseUrl}/${language}${path}`;
  
  // Translated title and description
  const title = t(titleKey);
  const description = t(descriptionKey);
  
  // Locale for Open Graph tags
  const locale = language === 'en' ? 'en_US' : 'es_ES';
  
  return (
    <Helmet>
      {/* Basic metadata */}
      <html lang={language} />
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={locale} />
      
      {/* Twitter card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      
      {/* Hreflang tags for language alternatives */}
      <link rel="alternate" hrefLang="en" href={`${baseUrl}/en${path}`} />
      <link rel="alternate" hrefLang="es" href={`${baseUrl}/es${path}`} />
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/en${path}`} />
    </Helmet>
  );
};

export default SEOMetadata;