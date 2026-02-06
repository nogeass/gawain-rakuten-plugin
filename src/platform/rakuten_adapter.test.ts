import { describe, it, expect } from 'vitest';
import {
  convertRakutenProduct,
  validateRakutenProduct,
  type RakutenProduct,
} from './rakuten_adapter.js';

describe('rakuten_adapter', () => {
  const sampleProduct: RakutenProduct = {
    itemCode: 'headphones-001',
    itemName: 'Premium Wireless Headphones',
    itemCaption: '<p>Experience crystal-clear sound.</p><p>Features 40-hour battery life.</p>',
    shopCode: 'audiotech-rakuten',
    shopName: 'AudioTech Official Store',
    genreId: '100051',
    itemPrice: 29800,
    taxFlag: 1,
    postageFlag: 0,
    reviewCount: 128,
    reviewAverage: 4.5,
    availability: 1,
    mediumImageUrls: [
      'https://thumbnail.image.rakuten.co.jp/@0_mall/audiotech/cabinet/headphones/front.jpg',
      'https://thumbnail.image.rakuten.co.jp/@0_mall/audiotech/cabinet/headphones/side.jpg',
    ],
    smallImageUrls: [
      'https://thumbnail.image.rakuten.co.jp/@0_mall/audiotech/cabinet/headphones/front_s.jpg',
    ],
    itemUrl: 'https://item.rakuten.co.jp/audiotech/headphones-001/',
    shopUrl: 'https://www.rakuten.co.jp/audiotech/',
  };

  describe('convertRakutenProduct', () => {
    it('should convert basic product fields', () => {
      const result = convertRakutenProduct(sampleProduct);
      expect(result.id).toBe('headphones-001');
      expect(result.title).toBe('Premium Wireless Headphones');
    });

    it('should strip HTML from description', () => {
      const result = convertRakutenProduct(sampleProduct);
      expect(result.description).toBe('Experience crystal-clear sound.Features 40-hour battery life.');
    });

    it('should use mediumImageUrls for images', () => {
      const result = convertRakutenProduct(sampleProduct);
      expect(result.images).toEqual([
        'https://thumbnail.image.rakuten.co.jp/@0_mall/audiotech/cabinet/headphones/front.jpg',
        'https://thumbnail.image.rakuten.co.jp/@0_mall/audiotech/cabinet/headphones/side.jpg',
      ]);
    });

    it('should fall back to smallImageUrls if no medium images', () => {
      const productWithSmallOnly: RakutenProduct = {
        ...sampleProduct,
        mediumImageUrls: [],
      };
      const result = convertRakutenProduct(productWithSmallOnly);
      expect(result.images).toEqual([
        'https://thumbnail.image.rakuten.co.jp/@0_mall/audiotech/cabinet/headphones/front_s.jpg',
      ]);
    });

    it('should extract price with default JPY currency', () => {
      const result = convertRakutenProduct(sampleProduct);
      expect(result.price).toEqual({ amount: '29800', currency: 'JPY' });
    });

    it('should include Rakuten-specific metadata', () => {
      const result = convertRakutenProduct(sampleProduct);
      expect(result.metadata).toEqual({
        source: 'rakuten',
        shopCode: 'audiotech-rakuten',
        shopName: 'AudioTech Official Store',
        genreId: '100051',
        taxIncluded: true,
        reviewCount: 128,
        reviewAverage: 4.5,
        itemUrl: 'https://item.rakuten.co.jp/audiotech/headphones-001/',
        shopUrl: 'https://www.rakuten.co.jp/audiotech/',
      });
    });

    it('should handle taxFlag correctly', () => {
      const taxExcluded: RakutenProduct = { ...sampleProduct, taxFlag: 0 };
      const result = convertRakutenProduct(taxExcluded);
      expect(result.metadata?.taxIncluded).toBe(false);
    });
  });

  describe('validateRakutenProduct', () => {
    it('should return true for valid product', () => {
      expect(validateRakutenProduct(sampleProduct)).toBe(true);
    });

    it('should return false for null', () => {
      expect(validateRakutenProduct(null)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(validateRakutenProduct('string')).toBe(false);
    });

    it('should return false for missing itemCode', () => {
      const invalid = { itemName: 'Test', itemPrice: 1000 };
      expect(validateRakutenProduct(invalid)).toBe(false);
    });

    it('should return false for empty itemCode', () => {
      const invalid = { itemCode: '   ', itemName: 'Test', itemPrice: 1000 };
      expect(validateRakutenProduct(invalid)).toBe(false);
    });

    it('should return false for missing itemName', () => {
      const invalid = { itemCode: 'test-001', itemPrice: 1000 };
      expect(validateRakutenProduct(invalid)).toBe(false);
    });

    it('should return false for empty itemName', () => {
      const invalid = { itemCode: 'test-001', itemName: '   ', itemPrice: 1000 };
      expect(validateRakutenProduct(invalid)).toBe(false);
    });

    it('should return false for missing itemPrice', () => {
      const invalid = { itemCode: 'test-001', itemName: 'Test' };
      expect(validateRakutenProduct(invalid)).toBe(false);
    });

    it('should return false for negative itemPrice', () => {
      const invalid = { itemCode: 'test-001', itemName: 'Test', itemPrice: -100 };
      expect(validateRakutenProduct(invalid)).toBe(false);
    });

    it('should return true for product with smallImageUrls only', () => {
      const valid = {
        itemCode: 'test-001',
        itemName: 'Test',
        itemPrice: 1000,
        smallImageUrls: ['https://example.com/img.jpg'],
      };
      expect(validateRakutenProduct(valid)).toBe(true);
    });
  });
});
