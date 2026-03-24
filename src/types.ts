export type HotspotType = 
  | 'standard' 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'signup_form' 
  | 'product'
  | 'image_description'
  | 'description_only'
  | 'video_cta'
  | 'email_signup_image';

export interface Hotspot {
  id: string;
  type: HotspotType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  title: string;
  description?: string;
  price?: string;
  ctaText?: string;
  icon?: string;
  backgroundColor?: string;
  iconColor?: string;
  pulseAnimation?: boolean;
  triggerType?: 'click' | 'hover';
  action: {
    type: string;
    value: string;
  };
  radius?: number;
  filters?: {
    brightness?: number;
    contrast?: number;
    blur?: number;
    grayscale?: boolean;
    sepia?: boolean;
    invert?: boolean;
    hue?: number;
    saturation?: number;
    opacity?: number;
    noise?: number;
    pixelSize?: number;
  };
}

export interface Campaign {
  id: string;
  name: string;
  imageUrl: string;
  userId: string;
  createdAt: string;
  hotspots: Hotspot[];
  filters?: {
    brightness?: number;
    contrast?: number;
    blur?: number;
    grayscale?: boolean;
    sepia?: boolean;
    invert?: boolean;
    hue?: number;
    saturation?: number;
    opacity?: number;
    noise?: number;
    pixelSize?: number;
    vignette?: number;
  };
}

export interface Domain {
  id: string;
  userId: string;
  name: string;
  verified: boolean;
}

export interface Lead {
  id: string;
  campaignId: string;
  name: string;
  email: string;
  timestamp: string;
}

export interface AnalyticsEvent {
  id: string;
  campaignId: string;
  eventType: 'view' | 'click' | 'cta';
  timestamp: string;
  metadata?: any;
}
