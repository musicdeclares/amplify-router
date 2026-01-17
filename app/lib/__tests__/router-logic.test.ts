import { getCountryFromRequest } from '../router-logic'

// Mock Supabase for these tests
jest.mock('../supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(),
          lte: jest.fn(),
          gte: jest.fn()
        }))
      })),
      insert: jest.fn()
    }))
  }
}))

describe('Router Logic', () => {
  describe('getCountryFromRequest', () => {
    it('should extract country from Vercel headers', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-vercel-ip-country') return 'US'
            return null
          })
        }
      } as unknown as Request

      const country = getCountryFromRequest(mockRequest)
      expect(country).toBe('US')
    })

    it('should fall back to Cloudflare headers', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-vercel-ip-country') return 'unknown'
            if (header === 'cf-ipcountry') return 'GB'
            return null
          })
        }
      } as unknown as Request

      const country = getCountryFromRequest(mockRequest)
      expect(country).toBe('GB')
    })

    it('should return undefined when no country headers available', () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null)
        }
      } as unknown as Request

      const country = getCountryFromRequest(mockRequest)
      expect(country).toBeUndefined()
    })
  })
})
