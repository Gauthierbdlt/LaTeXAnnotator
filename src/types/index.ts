export type ToolMode = 
  | 'select'
  | 'hand'
  | 'text'
  | 'latex'
  | 'image'
  | 'pen'
  | 'rectangle'
  | 'rounded-rect'
  | 'oval'
  | 'line'
  | 'arrow'
  | 'star'
  | 'speech-bubble'
  | 'highlight'
  | 'note'
  | 'signature'
  | 'loupe';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type SidebarTab = 'thumbnails' | 'outline' | 'annotations' | 'bookmarks';

export type GridMode = 'none' | 'millimeter' | 'dot' | 'lines';

export type PageViewMode = 'single' | 'continuous';

export type UIMode = 'macos' | 'ipad';

export interface BaseAnnotation {
  id: string;
  pageIndex: number;
  x: number; // in points/pixels relative to natural page size
  y: number;
  width: number;
  height: number;
  rotation?: number; // degrees
  createdAt: number;
  locked?: boolean;
}

export interface LaTeXAnnotationItem extends BaseAnnotation {
  type: 'latex';
  latex: string;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
}

export interface ImageLayerItem extends BaseAnnotation {
  type: 'image';
  src: string; // data URL or URL
  filename?: string;
  opacity: number;
  hasShadow?: boolean;
  borderRadius?: number;
  naturalWidth: number;
  naturalHeight: number;
}

export interface ShapeAnnotationItem extends BaseAnnotation {
  type: 'shape';
  shapeType: 'rectangle' | 'rounded-rect' | 'oval' | 'line' | 'arrow' | 'star' | 'speech-bubble';
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
}

export interface PenStrokeItem extends BaseAnnotation {
  type: 'pen';
  points: Point[];
  strokeColor: string;
  strokeWidth: number;
  isHighlighter?: boolean;
}

export interface TextAnnotationItem extends BaseAnnotation {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  isBold?: boolean;
  isItalic?: boolean;
  alignment?: 'left' | 'center' | 'right';
}

export interface NoteAnnotationItem extends BaseAnnotation {
  type: 'note';
  text: string;
  color: string; // sticky note color (yellow, blue, green, pink)
  isOpen?: boolean;
}

export interface HighlightAnnotationItem extends BaseAnnotation {
  type: 'highlight';
  rects: { x: number; y: number; width: number; height: number }[];
  color: string;
  selectedText?: string;
}

export type AnyAnnotation = 
  | LaTeXAnnotationItem 
  | ImageLayerItem 
  | ShapeAnnotationItem 
  | PenStrokeItem 
  | TextAnnotationItem 
  | NoteAnnotationItem
  | HighlightAnnotationItem;

export interface TextLine {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: string;
  width?: number;
}

export interface DocumentPage {
  index: number;
  width: number;
  height: number;
  title?: string;
  canvasImage?: string; // pre-rendered page image data URL
  textLines?: TextLine[];
}

export interface LoadedDocument {
  id: string;
  filename: string;
  fileType: 'pdf' | 'image';
  fileSize: number;
  lastModified: number;
  pageCount: number;
  pages: DocumentPage[];
}
