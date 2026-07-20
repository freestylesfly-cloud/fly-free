import dynamic from 'next/dynamic';
import React from 'react';

const DefaultLoader = () => (
  React.createElement('div', { className: 'flex items-center justify-center p-8' },
    React.createElement('div', {
      className: 'animate-spin rounded-full h-12 w-12 border-4 border-gray-200',
      style: { borderTopColor: 'var(--color-primary)' }
    })
  )
);

export const lazyComponents = {
  HeroSection: dynamic(() => import('../components/HeroSection').then(m => ({ default: m.HeroSection })), { loading: DefaultLoader }),
  ProductCard: dynamic(() => import('../components/ProductCard').then(m => ({ default: m.ProductCard })), { loading: DefaultLoader }),
  DesignCanvasPreview: dynamic(() => import('../components/DesignCanvasPreview').then(m => ({ default: m.DesignCanvasPreview })), { loading: DefaultLoader }),
  HeroBannerCarousel: dynamic(() => import('../components/HeroBannerCarousel').then(m => ({ default: m.HeroBannerCarousel })), { loading: DefaultLoader })
};
