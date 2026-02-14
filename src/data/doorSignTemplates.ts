import type { SignDesign } from '../types/design'

export interface DoorSignTemplate {
  id: string
  name: string
  description: string
}

function uid(): string {
  return crypto.randomUUID()
}

function createKlassisk(): SignDesign {
  return {
    canvasWidth: 700,
    canvasHeight: 500,
    backgroundColor: 'transparent',
    elements: [
      {
        id: uid(), type: 'line',
        x: 140, y: 195, width: 420, height: 0, x2: 560, y2: 195,
        rotation: 0, fill: 'none', stroke: '#1a1a1a', strokeWidth: 2, opacity: 1,
      },
      {
        id: uid(), type: 'text',
        text: 'Ola Nilsens veg 23',
        x: 140, y: 220, width: 420, height: 50,
        fontSize: 42, fontFamily: 'Inter', fontWeight: 600,
        textAnchor: 'middle' as const, letterSpacing: 1,
        rotation: 0, fill: '#1a1a1a', stroke: 'none', strokeWidth: 0, opacity: 1,
      },
      {
        id: uid(), type: 'line',
        x: 140, y: 300, width: 420, height: 0, x2: 560, y2: 300,
        rotation: 0, fill: 'none', stroke: '#1a1a1a', strokeWidth: 2, opacity: 1,
      },
    ],
  }
}

function createModerne(): SignDesign {
  return {
    canvasWidth: 700,
    canvasHeight: 500,
    backgroundColor: 'transparent',
    elements: [
      {
        id: uid(), type: 'text',
        text: 'Ola Nilsens veg',
        x: 120, y: 190, width: 320, height: 30,
        fontSize: 28, fontFamily: 'Inter', fontWeight: 300,
        textAnchor: 'start' as const, letterSpacing: 3,
        rotation: 0, fill: '#1a1a1a', stroke: 'none', strokeWidth: 0, opacity: 1,
      },
      {
        id: uid(), type: 'text',
        text: '23',
        x: 440, y: 170, width: 140, height: 72,
        fontSize: 72, fontFamily: 'Inter', fontWeight: 700,
        textAnchor: 'end' as const, letterSpacing: 0,
        rotation: 0, fill: '#1a1a1a', stroke: 'none', strokeWidth: 0, opacity: 1,
      },
      {
        id: uid(), type: 'line',
        x: 120, y: 280, width: 460, height: 0, x2: 580, y2: 280,
        rotation: 0, fill: 'none', stroke: '#1a1a1a', strokeWidth: 1, opacity: 1,
      },
    ],
  }
}

function createInnrammet(): SignDesign {
  return {
    canvasWidth: 700,
    canvasHeight: 500,
    backgroundColor: 'transparent',
    elements: [
      {
        id: uid(), type: 'rect',
        x: 100, y: 150, width: 500, height: 200,
        rx: 14, ry: 14,
        rotation: 0, fill: 'none', stroke: '#1a1a1a', strokeWidth: 3, opacity: 1,
      },
      {
        id: uid(), type: 'text',
        text: 'Ola Nilsens veg 23',
        x: 120, y: 220, width: 460, height: 50,
        fontSize: 40, fontFamily: 'Inter', fontWeight: 600,
        textAnchor: 'middle' as const, letterSpacing: 1,
        rotation: 0, fill: '#1a1a1a', stroke: 'none', strokeWidth: 0, opacity: 1,
      },
    ],
  }
}

function createStorNummer(): SignDesign {
  return {
    canvasWidth: 700,
    canvasHeight: 500,
    backgroundColor: 'transparent',
    elements: [
      {
        id: uid(), type: 'text',
        text: '23',
        x: 200, y: 150, width: 300, height: 100,
        fontSize: 100, fontFamily: 'Inter', fontWeight: 700,
        textAnchor: 'middle' as const, letterSpacing: 0,
        rotation: 0, fill: '#1a1a1a', stroke: 'none', strokeWidth: 0, opacity: 1,
      },
      {
        id: uid(), type: 'line',
        x: 250, y: 280, width: 200, height: 0, x2: 450, y2: 280,
        rotation: 0, fill: 'none', stroke: '#1a1a1a', strokeWidth: 2, opacity: 1,
      },
      {
        id: uid(), type: 'text',
        text: 'Ola Nilsens veg',
        x: 200, y: 305, width: 300, height: 32,
        fontSize: 30, fontFamily: 'Inter', fontWeight: 400,
        textAnchor: 'middle' as const, letterSpacing: 3,
        rotation: 0, fill: '#1a1a1a', stroke: 'none', strokeWidth: 0, opacity: 1,
      },
    ],
  }
}

function createTodelt(): SignDesign {
  return {
    canvasWidth: 700,
    canvasHeight: 500,
    backgroundColor: 'transparent',
    elements: [
      {
        id: uid(), type: 'text',
        text: '23',
        x: 120, y: 185, width: 220, height: 85,
        fontSize: 82, fontFamily: 'Inter', fontWeight: 700,
        textAnchor: 'middle' as const, letterSpacing: 0,
        rotation: 0, fill: '#1a1a1a', stroke: 'none', strokeWidth: 0, opacity: 1,
      },
      {
        id: uid(), type: 'line',
        x: 340, y: 175, width: 0, height: 150, x2: 340, y2: 325,
        rotation: 0, fill: 'none', stroke: '#1a1a1a', strokeWidth: 2, opacity: 1,
      },
      {
        id: uid(), type: 'text',
        text: 'Ola Nilsens',
        x: 365, y: 205, width: 230, height: 32,
        fontSize: 32, fontFamily: 'Inter', fontWeight: 600,
        textAnchor: 'start' as const, letterSpacing: 1,
        rotation: 0, fill: '#1a1a1a', stroke: 'none', strokeWidth: 0, opacity: 1,
      },
      {
        id: uid(), type: 'text',
        text: 'veg',
        x: 365, y: 255, width: 230, height: 28,
        fontSize: 24, fontFamily: 'Inter', fontWeight: 300,
        textAnchor: 'start' as const, letterSpacing: 2,
        rotation: 0, fill: '#1a1a1a', stroke: 'none', strokeWidth: 0, opacity: 1,
      },
    ],
  }
}

export const doorSignTemplates: DoorSignTemplate[] = [
  { id: 'klassisk', name: 'Klassisk', description: 'Sentrert tekst med dekorative linjer' },
  { id: 'moderne', name: 'Moderne', description: 'Lett og asymmetrisk layout' },
  { id: 'innrammet', name: 'Innrammet', description: 'Tekst i en avrundet ramme' },
  { id: 'stor-nummer', name: 'Stort nummer', description: 'Husnummer i fokus' },
  { id: 'todelt', name: 'Todelt', description: 'Nummer og adresse side om side' },
]

const creators: Record<string, () => SignDesign> = {
  'klassisk': createKlassisk,
  'moderne': createModerne,
  'innrammet': createInnrammet,
  'stor-nummer': createStorNummer,
  'todelt': createTodelt,
}

export function createTemplateDesign(templateId: string): SignDesign {
  return creators[templateId]()
}
