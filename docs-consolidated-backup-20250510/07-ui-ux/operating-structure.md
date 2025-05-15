# Operating Structure v1.0

## 📅 System Automation Overview
AI Sports Edge is structured to automate key processes through intelligent task coordination by Olive, focusing on maximum efficiency, creative feedback, and data-driven decision-making. Below is the structure for tasks and automation.

---

## 🧠 Core Roles and Time-Based Responsibilities

| Team Member | Time Assigned | Daily Responsibility | Triggered By |
|-------------|---------------|----------------------|--------------|
| **Founder and CEO** | 8:00 AM, 12 PM, 5 PM, 11 PM | Approvals, strategy, oversight of automation results | Olive |
| **Samuel Pepe (CTO)** | 7:00–10:00 AM | Infra debugging, onboarding stability, Firebase sync | Cron at 7:00 AM |
| **Grant Langford (Referral Ops)** | 12:00 PM | Update referral metrics, respond to GPT feedback loop | Olive midday trigger |
| **Clarke Everett (Finance)** | 12:00 PM | Stripe reconciliation, revenue summary | Olive midday sync |
| **Camille Reyes (Copy)** | 12:00 PM | CTA/A/B copy updates | Olive midday prompt |
| **Sloane Bennett (Brand)** | 11:00 PM | Draft social posts, respond to comments | Olive late night prompt |
| **Lucía Morales (i18n)** | 8:00 AM | Update Spanish UX wireframe, flag translation bottlenecks | Olive morning task loop |
| **Rajiv (ML Checks)** | 2:00 AM | Review model outputs, flag errors or retrain triggers | Cron + Olive overnight summary |
| **Charlie** | 5:00 PM | Draft short-form educational copy | Olive evening sync |
| **Mira** | 5:00 PM | Draft long-form educational content | Olive evening sync |

---

## 📅 System Automation Schedule

For full reference, see: `cron-schedule.md`

## 🔁 Instructions to Update

Olive automatically loads `cron-schedule.md` every Monday during the 8:00 AM check-in to summarize task automation, identify missed executions, and ensure alignment across system triggers.
