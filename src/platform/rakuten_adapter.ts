/**
 * Rakuten platform adapter
 * Converts Rakuten product data to Gawain format
 */

import type { ProductInput } from '../gawain/types.js';

/**
 * Rakuten product structure (based on Rakuten Ichiba API)
 * See: https://webservice.rakuten.co.jp/documentation/ichiba-item-search
 */
export interface RakutenProduct {
  itemCode: string;
  itemName: string;
  itemCaption?: string;
  shopCode?: string;
  shopName?: string;
  genreId?: string;
  itemPrice: number;
  taxFlag?: number; // 0: tax excluded, 1: tax included
  postageFlag?: number; // 0: shipping not included, 1: shipping included
  creditCardFlag?: number;
  shopOfTheYearFlag?: number;
  shipOverseasFlag?: number;
  asurakuFlag?: number; // Same-day delivery flag
  pointRate?: number;
  pointRateStartTime?: string;
  pointRateEndTime?: string;
  reviewCount?: number;
  reviewAverage?: number;
  availability?: number; // 0: unavailable, 1: available
  mediumImageUrls?: string[];
  smallImageUrls?: string[];
  itemUrl?: string;
  shopUrl?: string;
  tagIds?: number[];
}

/**
 * Rakuten price context
 */
export interface RakutenPriceContext {
  currency?: string;
  includeTax?: boolean;
}

/**
 * Convert Rakuten product to Gawain ProductInput
 */
export function convertRakutenProduct(
  product: RakutenProduct,
  priceContext?: RakutenPriceContext
): ProductInput {
  // Extract price information
  const currency = priceContext?.currency || 'JPY';
  const taxIncluded = product.taxFlag === 1;

  const price = {
    amount: String(product.itemPrice),
    currency,
  };

  // Use medium images if available, otherwise fall back to small images
  const images = product.mediumImageUrls?.length
    ? product.mediumImageUrls
    : product.smallImageUrls || [];

  // Clean description - Rakuten descriptions may contain HTML
  const description = product.itemCaption
    ? product.itemCaption.replace(/<[^>]*>/g, '').trim()
    : undefined;

  return {
    id: product.itemCode,
    title: product.itemName,
    description,
    images,
    price,
    metadata: {
      source: 'rakuten',
      shopCode: product.shopCode,
      shopName: product.shopName,
      genreId: product.genreId,
      taxIncluded,
      reviewCount: product.reviewCount,
      reviewAverage: product.reviewAverage,
      itemUrl: product.itemUrl,
      shopUrl: product.shopUrl,
    },
  };
}

/**
 * Validate Rakuten product has required fields
 */
export function validateRakutenProduct(product: unknown): product is RakutenProduct {
  if (!product || typeof product !== 'object') {
    return false;
  }

  const p = product as Record<string, unknown>;

  // Required fields
  if (typeof p.itemCode !== 'string' || !p.itemCode.trim()) {
    return false;
  }
  if (typeof p.itemName !== 'string' || !p.itemName.trim()) {
    return false;
  }
  if (typeof p.itemPrice !== 'number' || p.itemPrice < 0) {
    return false;
  }

  // Images should have at least one
  const hasImages =
    (Array.isArray(p.mediumImageUrls) && p.mediumImageUrls.length > 0) ||
    (Array.isArray(p.smallImageUrls) && p.smallImageUrls.length > 0);

  if (!hasImages) {
    console.warn('Product has no images');
  }

  return true;
}
