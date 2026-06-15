import { describe, it, expect } from 'vitest'
import { classifyLightDirection, relativeAngle } from '../../src/astro/sun-direction'

/*
 Convention (documented + locked by these tests):
 - `facing` = the compass bearing (deg from north) the photographer shoots TOWARD
   (camera -> subject).
 - `sunAz`  = the sun's azimuth (deg from north).
 - When the sun sits in roughly the SAME direction you're shooting (sunAz ≈ facing),
   the sun is BEHIND the subject -> backlit / silhouette.
 - When the sun is roughly OPPOSITE your shooting direction (sunAz ≈ facing ± 180),
   it lights the face of the subject the camera sees -> front-lit.
 - Perpendicular -> side-lit.
 This is the off-by-180 trap; these cases pin the correct orientation.
*/

describe('relativeAngle', () => {
  it('is 0 for identical bearings', () => {
    expect(relativeAngle(270, 270)).toBe(0)
  })
  it('is symmetric and wraps around north', () => {
    expect(relativeAngle(10, 350)).toBe(20)
    expect(relativeAngle(350, 10)).toBe(20)
  })
  it('caps at 180', () => {
    expect(relativeAngle(0, 180)).toBe(180)
  })
})

describe('classifyLightDirection', () => {
  it('backlights when the sun is beyond the subject (high sun)', () => {
    expect(classifyLightDirection(270, 270, 30)).toBe('back')
  })

  it('silhouettes when the sun is beyond the subject and low (<=10 deg)', () => {
    expect(classifyLightDirection(285, 270, 6)).toBe('silhouette')
    expect(classifyLightDirection(270, 270, 10)).toBe('silhouette')
  })

  it('keeps backlit (not silhouette) when a back sun is high', () => {
    expect(classifyLightDirection(270, 270, 40)).toBe('back')
  })

  it('front-lights when the sun is behind the camera', () => {
    expect(classifyLightDirection(90, 270, 30)).toBe('front')
  })

  it('side-lights when the sun is perpendicular', () => {
    expect(classifyLightDirection(0, 270, 30)).toBe('side')
  })

  it('a low perpendicular sun is still side-lit (silhouette is back-only)', () => {
    expect(classifyLightDirection(0, 270, 3)).toBe('side')
  })

  it('treats rel=45 as the back boundary and rel=135 as the front boundary', () => {
    expect(classifyLightDirection(45, 0, 30)).toBe('back')
    expect(classifyLightDirection(135, 0, 30)).toBe('front')
  })

  it('handles the Curtis Hixon sunset case (sun behind the minarets, low)', () => {
    // shoot west toward the minarets; June sunset sun ~WNW, low -> silhouette
    expect(classifyLightDirection(288, 270, 3)).toBe('silhouette')
  })

  it('wraps around north', () => {
    expect(classifyLightDirection(10, 350, 30)).toBe('back')
  })
})
