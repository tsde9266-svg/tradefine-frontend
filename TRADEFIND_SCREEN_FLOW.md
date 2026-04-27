# TradeFind — Complete Screen Inventory & Claude Code Flow
# 34 screens confirmed. 3 duplicate/versioned screens resolved below.
# Use this file to give Claude Code its start commands batch by batch.

---

## DUPLICATE SCREENS — CANONICAL VERSIONS TO USE

These folders have multiple versions. Use ONLY the canonical one listed:

| Screen | Use This | Ignore These |
|--------|----------|--------------|
| Map | `map_view_sync` | ~~map_view~~, ~~map_view_redesign~~ |
| Onboarding Step 3 | `worker_onboarding_step_3_sync` | ~~worker_onboarding_step_3~~ |
| Design system | `industrial_premium/DESIGN.md` | (reference only, no code.html) |

**Total canonical screens: 32**

---

## COMPLETE SCREEN FLOW MAP

### 🔵 AUTH FLOW (both user types)

```
splash_welcome
  ├──[I need a tradesperson]──► register_login (Sign Up tab, role = Customer)
  └──[I'm a tradesperson]─────► register_login (Sign Up tab, role = Worker)

register_login
  ├──[Create Account → Customer]──► customer_home_discovery
  ├──[Create Account → Worker]───► worker_onboarding → step_2 → step_3_sync → step_4
  │                                    └──[Submit & Go Live]──► pending_approval
  │                                         └──[approved]──► worker_dashboard_offline
  └──[Sign In]
       ├──[customer]──► customer_home_discovery
       └──[worker]────► worker_dashboard_offline (or _live if was live)
```

---

### 🟢 CUSTOMER FLOW

```
customer_home_discovery  [HOME tab]
  ├──[search bar]────────────────► search_results
  ├──[worker card tap]───────────► worker_profile_customer_view
  ├──[See all — Available Now]───► available_now_full_list
  ├──[See all — Top Rated]───────► top_rated_full_list
  ├──[bell icon in nav]──────────► notifications
  ├──[MAP tab]───────────────────► map_view_sync
  ├──[JOBS tab]──────────────────► job_history
  └──[PROFILE tab]───────────────► customer_profile_settings

search_results
  └──[worker card tap]──► worker_profile_customer_view

available_now_full_list
  └──[worker card tap]──► worker_profile_customer_view

top_rated_full_list
  └──[worker card tap]──► worker_profile_customer_view

map_view_sync  [MAP tab]
  └──[worker pin / card tap]──► worker_profile_customer_view

worker_profile_customer_view
  ├──[Call / Send Request]──► customer_booking_sync
  ├──[bookmark icon]────────► saved_bookmarks (adds to saved, no nav)
  └──[back]─────────────────► previous screen

customer_booking_sync
  └──[Send Request]──► live_tracking (after worker accepts)

live_tracking
  └──[worker arrives]──► leave_a_review

leave_a_review
  └──[Post Review]──► customer_home_discovery (toast + nav back)

job_history  [JOBS tab]
  ├──[Rebook]──────────────────► worker_profile_customer_view
  ├──[Leave review]────────────► leave_a_review
  └──[View profile]────────────► worker_profile_customer_view

saved_bookmarks
  ├──[worker card tap]──► worker_profile_customer_view
  └──[Call button]──────► customer_booking_sync

customer_profile_settings  [PROFILE tab]
  ├──[Edit Profile row]──────────► edit_profile
  ├──[Saved Professionals row]───► saved_bookmarks
  ├──[Past Jobs row]─────────────► job_history
  ├──[My Reviews row]────────────► my_reviews_customer
  ├──[Location Settings row]─────► location_settings
  ├──[Security row]──────────────► security_settings
  └──[Notifications row / bell]──► notifications

edit_profile
  └──[Save]──► customer_profile_settings

location_settings
  └──[Save Changes]──► customer_profile_settings

security_settings
  └──[back]──► customer_profile_settings

my_reviews_customer
  └──[back]──► customer_profile_settings

notifications
  ├──[Track Now tap]──► live_tracking
  └──[back]───────────► customer_home_discovery
```

---

### 🟠 WORKER FLOW

```
worker_onboarding  [Step 1 of 4]
  └──[Continue]──► worker_onboarding_step_2

worker_onboarding_step_2  [Step 2 of 4]
  └──[Continue]──► worker_onboarding_step_3_sync

worker_onboarding_step_3_sync  [Step 3 of 4]
  └──[Continue]──► worker_onboarding_step_4

worker_onboarding_step_4  [Step 4 of 4]
  └──[Submit & Go Live]──► pending_approval

pending_approval
  └──[push notification: approved]──► worker_dashboard_offline

worker_dashboard_offline  [HOME tab — isAvailable=false]
  ├──[toggle ON / Go Available]──► worker_dashboard_live
  ├──[bell icon]─────────────────► notifications (worker version)
  ├──[REVIEWS tab]───────────────► (worker reviews — not in zip, use my_reviews_customer as reference)
  └──[PROFILE tab]───────────────► (worker profile — not in zip separately)

worker_dashboard_live  [HOME tab — isAvailable=true]
  ├──[toggle OFF / Go Offline]───► worker_dashboard_offline
  ├──[incoming job push]─────────► worker_job_request_updated
  └──[Edit area link]────────────► location_settings (reuse)

worker_job_request_updated  [MODAL — full screen]
  ├──[Accept Job]──► worker_active_job_updated
  └──[Decline]─────► worker_dashboard_live

worker_active_job_updated
  ├──[Mark Job Complete]──► payment_summary_sync
  └──[Call customer]──────► (tel: link)

payment_summary_sync
  ├──[Rate Customer]──────────────► leave_a_review (worker rates customer)
  └──[Return to Dashboard]────────► worker_dashboard_offline

worker_earnings_sync
  └──[back]──► worker_dashboard_offline or worker profile
  (accessed from: worker profile settings list → "Earnings & Payouts" row)
```

---

## CLAUDE CODE — BATCH START COMMANDS

Run these in order. Each batch = one Claude Code session.
Give Claude the prompt from `CLAUDE_CODE_UI_SYNC.md` first, then use the start command.

### BATCH 1 — Auth screens (foundation, sets the token system)
```
Start with splash_welcome and register_login.
Reference screens: assets/stitch/splash_welcome/screen.png and register_login/screen.png
After completing these two, create src/theme/tokens.ts and the three shared components 
(FloatingNav, PrimaryButton, MetricCard) before moving on.
```

### BATCH 2 — Customer core (highest traffic screens)
```
Start with customer_home_discovery and worker_profile_customer_view.
Reference screens: customer_home_discovery/screen.png and worker_profile_customer_view/screen.png
```

### BATCH 3 — Discovery screens
```
Start with search_results and map_view_sync.
Reference screens: search_results/screen.png and map_view_sync/screen.png
Note: map_view_sync is the canonical map screen — ignore map_view and map_view_redesign folders.
```

### BATCH 4 — Customer transaction flow
```
Start with customer_booking_sync and live_tracking.
Reference screens: customer_booking_sync/screen.png and live_tracking/screen.png
These two screens are connected: booking → tracking. Ensure back navigation is consistent.
```

### BATCH 5 — Post-job customer screens
```
Start with leave_a_review and job_history.
Reference screens: leave_a_review/screen.png and job_history/screen.png
```

### BATCH 6 — Customer lists
```
Start with available_now_full_list and top_rated_full_list.
Reference screens: available_now_full_list/screen.png and top_rated_full_list/screen.png
Both screens navigate to worker_profile_customer_view on card tap.
```

### BATCH 7 — Customer profile hub
```
Start with customer_profile_settings and saved_bookmarks.
Reference screens: customer_profile_settings/screen.png and saved_bookmarks/screen.png
customer_profile_settings is the hub for edit_profile, location_settings, security_settings, 
my_reviews_customer — make sure all rows have correct onPress handlers.
```

### BATCH 8 — Customer settings screens
```
Start with edit_profile and location_settings.
Reference screens: edit_profile/screen.png and location_settings/screen.png
```

### BATCH 9 — Customer settings screens (cont.)
```
Start with security_settings and my_reviews_customer.
Reference screens: security_settings/screen.png and my_reviews_customer/screen.png
```

### BATCH 10 — Notifications
```
Start with notifications only (single screen, more complex).
Reference screen: notifications/screen.png
This screen is accessed from bell icon on customer_home_discovery nav bar AND 
from customer_profile_settings. Ensure both entry points work.
```

### BATCH 11 — Worker onboarding (linear flow)
```
Start with worker_onboarding and worker_onboarding_step_2.
Reference screens: worker_onboarding/screen.png and worker_onboarding_step_2/screen.png
Note: worker_onboarding_step_3_sync is canonical for step 3 (ignore worker_onboarding_step_3).
```

### BATCH 12 — Worker onboarding (cont.) + pending
```
Start with worker_onboarding_step_3_sync and worker_onboarding_step_4.
Reference screens: worker_onboarding_step_3_sync/screen.png and worker_onboarding_step_4/screen.png
After step 4 → pending_approval. Do pending_approval as a third screen this batch if tokens allow.
```

### BATCH 13 — Worker dashboards (two states, one screen)
```
Start with worker_dashboard_offline and worker_dashboard_live.
Reference screens: worker_dashboard_offline/screen.png and worker_dashboard_live/screen.png
These are the SAME screen component with different state (isAvailable boolean).
Build as one file with conditional rendering, not two separate screens.
```

### BATCH 14 — Worker job flow
```
Start with worker_job_request_updated and worker_active_job_updated.
Reference screens: worker_job_request_updated/screen.png and worker_active_job_updated/screen.png
worker_job_request_updated is a modal (no nav bar, dark background).
worker_active_job_updated has the "Mark Job Complete" primary action.
```

### BATCH 15 — Worker post-job + earnings
```
Start with payment_summary_sync and worker_earnings_sync.
Reference screens: payment_summary_sync/screen.png and worker_earnings_sync/screen.png
payment_summary_sync → [Rate Customer] → leave_a_review (reuse customer screen).
worker_earnings_sync is accessed from worker profile settings, not a tab.
```

---

## SCREENS NOT IN ZIP — HANDLE SEPARATELY

These screens were designed in prompts but Stitch didn't generate them.
Build from spec in the prompt docs, don't reference a stitch screen:

| Screen | Source spec | Accessed from |
|--------|-------------|---------------|
| Worker Profile/Settings | TRADEFIND_V3 prompt Screen 18 | Worker tab bar PROFILE |
| Worker Reviews | TRADEFIND_V3 prompt Screen 17 | Worker tab bar REVIEWS |
| Review Customer (worker) | TRADEFIND_V3 prompt Screen 17b | payment_summary_sync → Rate Customer |
| Pending Approval | pending_approval/screen.png ✅ exists | worker_onboarding_step_4 → Submit |

---

## QUICK REFERENCE — SCREEN → FILE NAME

| Screen Name | Folder | Tab |
|-------------|--------|-----|
| Splash | `splash_welcome` | — |
| Register/Login | `register_login` | — |
| Customer Home | `customer_home_discovery` | HOME |
| Map View | `map_view_sync` | MAP |
| Search Results | `search_results` | — |
| Worker Profile | `worker_profile_customer_view` | — |
| Booking Request | `customer_booking_sync` | — |
| Live Tracking | `live_tracking` | — |
| Leave Review | `leave_a_review` | — |
| Job History | `job_history` | JOBS |
| Saved Workers | `saved_bookmarks` | — |
| Available Now | `available_now_full_list` | — |
| Top Rated | `top_rated_full_list` | — |
| Customer Profile | `customer_profile_settings` | PROFILE |
| Edit Profile | `edit_profile` | — |
| Location Settings | `location_settings` | — |
| Security | `security_settings` | — |
| My Reviews | `my_reviews_customer` | — |
| Notifications | `notifications` | — |
| Worker Onboarding 1 | `worker_onboarding` | — |
| Worker Onboarding 2 | `worker_onboarding_step_2` | — |
| Worker Onboarding 3 | `worker_onboarding_step_3_sync` | — |
| Worker Onboarding 4 | `worker_onboarding_step_4` | — |
| Pending Approval | `pending_approval` | — |
| Worker Dashboard | `worker_dashboard_offline` + `worker_dashboard_live` | HOME |
| Job Request Modal | `worker_job_request_updated` | — |
| Active Job | `worker_active_job_updated` | — |
| Payment Summary | `payment_summary_sync` | — |
| Worker Earnings | `worker_earnings_sync` | — |

---

*32 canonical screens · 15 batches · Start each batch with the command above*
