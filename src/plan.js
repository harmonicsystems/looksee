// A plan: blocks that play one after another, each with its own sets and a
// number of minutes, so a teacher can lay out what the screen shows through
// the day. Pure logic; App.svelte runs it and draws its editor.
//
// A block's minutes are minutes of playing: its clock stops while the slides
// are paused. When they are up, the next block begins at the next slide.

import { SETS } from './concepts.js'

export const MINUTES = [5, 10, 15, 20, 25]
export const PLAN_MAX = 12

// Whatever is stored or came in a link → blocks that can be played: known
// sets in the order of SETS, a length from MINUTES, no empty blocks.
export function normalizePlan(raw) {
  return (Array.isArray(raw) ? raw : [])
    .map((b) => ({
      sets: SETS.map((x) => x.id).filter((id) => Array.isArray(b?.sets) && b.sets.includes(id)),
      min: MINUTES.includes(b?.min) ? b.min : 10
    }))
    .filter((b) => b.sets.length)
    .slice(0, PLAN_MAX)
}

// The sets that play: every block's with a plan on, else the settings' own.
// Settings offers a set's own options only while the set is in use.
export const setsInUse = (s) => (s.planOn && s.plan.length ? s.plan.flatMap((b) => b.sets) : s.sets)

// Has a block that lasts `min` minutes had its time, after `ms` of playing?
export const blockDone = (min, ms) => ms >= min * 60000

// Whole minutes a block still has, for the control bar.
export const minutesLeft = (min, ms) => Math.max(0, Math.ceil(min - ms / 60000))

// The block that follows block `i`: the next one; after the last, the first
// again, or -1 (stop there) when the plan does not start over.
export const blockAfter = (plan, i, loop) => (i + 1 < plan.length ? i + 1 : loop ? 0 : -1)

// A plan in a settings link: "letters.numbers-10_feelings-5". Only characters
// a link leaves as they are, so it stays readable in the address bar.
export const planQuery = (plan) => plan.map((b) => b.sets.join('.') + '-' + b.min).join('_')
export const queryPlan = (v) =>
  v.split('_').map((b) => {
    const [sets, min] = b.split('-')
    return { sets: sets.split('.'), min: Number(min) }
  })
