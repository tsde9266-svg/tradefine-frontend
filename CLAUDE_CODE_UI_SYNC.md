# TradeFind UI Sync Prompt — Claude Code

## CONTEXT
You are updating an existing React Native / web app UI to match improved Stitch designs.
This is NOT a rebuild. Preserve all logic, routing, state, and functionality.
Only update visual presentation.

## BEFORE YOU WRITE A SINGLE LINE

1. Read `assets/screens/` — scan every screen image filename so you know what exists
2. Read the two reference screens I'll specify per batch (e.g. "welcome" + "home")
3. Run `grep -r "primary\|orange\|#F97" src/ --include="*.tsx" -l` to find files needing colour fix
4. Never touch: API calls, navigation logic, auth flow, state management, hooks

## THE ONE DESIGN TOKEN FILE — CREATE THIS FIRST

Create `src/theme/tokens.ts` if it doesn't exist:

```ts
export const T = {
  // Colours
  orange:     '#F97316',
  orangeHov:  '#C2410C',
  orangeShadow: 'rgba(249,115,22,0.28)',
  bg:         '#F9FAFB',
  card:       '#FFFFFF',
  text1:      '#111827',
  text2:      '#6B7280',
  text3:      '#9CA3AF',
  border:     '#F3F4F6',
  green:      '#16A34A',
  greenBg:    '#DCFCE7',
  amber:      '#D97706',
  amberBg:    '#FEF3C7',
  red:        '#EF4444',

  // Shadows
  cardShadow: '0 2px 8px rgba(0,0,0,0.06)',
  navShadow:  '0 2px 12px rgba(0,0,0,0.08)',

  // Radii
  card:  16,
  nav:   12,
  pill:  9999,
  input: 12,
  chip:  8,
} as const;
```

Every colour reference in every component must point here. No hardcoded hex elsewhere.

## THE 3 SHARED COMPONENTS — BUILD ONCE, USE EVERYWHERE

These components are reused across all screens. Build them once correctly.

### 1. FloatingNav
```
Props: title, subtitle?, leftAction ('back'|'menu'|'wordmark'), rightAction ('avatar'|'icon'|null), onLeft, onRight
Style: white card, 12px radius, mx-4 mt-3, shadow navShadow, h-14, flex row, items-center, justify-between, px-4, sticky top-3 z-50
Left button: 40×40, bg #F3F4F6, radius 10, chevron_left OR menu icon
Centre: title 16px/600/text1 + optional subtitle 12px/500/text2 below, centred
Right: 36px circle avatar with 2px #F97316 ring OR icon button
```

### 2. PrimaryButton  
```
Props: label, icon?, onPress, fullWidth?
Style: height 56px, bg #F97316, radius 9999, shadow orangeShadow
Text: 17px/700/white
Active: scale 0.97, bg #C2410C
NEVER use bg-primary — always bg #F97316 directly
```

### 3. MetricCard
```
Props: label, value, unit, subLabel, subColor ('green'|'grey')
Style: white card, 12px radius, 1px solid #F3F4F6 border (no shadow), p-3, flex-1
Label: 11px/600/#9CA3AF uppercase 0.5 tracking
Value: 36px/800/text1 (or #F97316 if primary metric) + unit 14px/500/text2 inline
SubLabel: 11px/500 — green #16A34A or grey #9CA3AF
Always rendered in a row of 3 with 12px gap
```

## PER-SCREEN UPDATE PROCESS

For each screen, I will tell you: "Update [ScreenName] to match assets/screens/[filename]"

Your process:
1. Open the image — identify: hero moment, card structure, button placement, nav variant
2. Open the existing screen file
3. Replace ONLY: colours, spacing, border-radius, font weights, component structure
4. Keep EXACTLY: all `onPress`/`onClick` handlers, navigation calls, data fetching, conditional logic
5. Swap nav bar to `<FloatingNav>`, all primary buttons to `<PrimaryButton>`, metrics to `<MetricCard>`
6. Test that no import breaks

## COLOUR BUG — FIX IN EVERY FILE YOU TOUCH

```
WRONG  →  CORRECT
bg-primary         →  bg-[#F97316]  or  style={{backgroundColor: T.orange}}
text-primary       →  text-[#F97316]
border-primary     →  border-[#F97316]
bg-primary-container already correct — leave it
```

## MAP SCREENS ONLY

For any screen containing a map component:
- Keep the map library/component unchanged
- Only update: the bottom sheet styles, worker pin styles, search pill styles
- Bottom sheet: white bg, 20px top radius, shadow `0 -4px 24px rgba(0,0,0,0.10)`
- Worker pin: 52px circle, 3px #F97316 ring, white fill, worker photo inside, shadow `0 4px 12px rgba(249,115,22,0.30)`
- Search pill: white, 26px radius, shadow `0 4px 16px rgba(0,0,0,0.10)`, orange search icon left

## TAB BAR — ONE DEFINITION

Find the tab bar component and ensure it matches exactly:
```
Height 83px, white bg, top border 1px #F3F4F6, shadow 0 -2px 12px rgba(0,0,0,0.05)
Customer tabs: Home | Map | Jobs | Profile
Worker tabs:   Home | Reviews | Profile
Active tab: icon + label #F97316, #FFF7ED rounded bg (px-3 py-1.5 rounded-[10px])
Inactive:   icon + label #9CA3AF
Icons: house | map | briefcase | person (customer) / house | star | person (worker)
```

## WHAT NOT TO TOUCH — EXPLICIT LIST

- No changes to: React Navigation stack/tab config, API service files, auth context, form validation, AsyncStorage/SecureStore calls, push notification handlers, permission requests
- If a component has no visual change needed — skip it entirely
- If unsure whether something is logic or style — leave it and note it

## OUTPUT FORMAT PER BATCH

After each screen update, output:
```
✅ [ScreenName] — updated
   Changed: nav bar, button colour, card radius, metric cards
   Preserved: onPress handlers (3), navigation to WorkerProfile, data fetch
   Skipped: [anything you intentionally left]
```

## START COMMAND

When I say "start with [screen1] and [screen2]" — do exactly those two screens only.
Confirm token count after each pair. Stop and ask before proceeding if a file exceeds 200 lines of changes.
