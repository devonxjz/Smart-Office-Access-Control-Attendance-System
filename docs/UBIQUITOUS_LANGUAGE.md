# Ubiquitous Language

This document defines the official domain terminology for the **Smart Office Access Control Attendance System** to ensure alignment across the physical IoT hardware, Apps Script backend, Google Sheets database, and Web Dashboard.

## Core Entities & People

| Term | Definition | Aliases to avoid |
| :--- | :--- | :--- |
| **Employee** | A registered worker whose physical office access is monitored and attendance is tracked. | User, staff, worker, employee profile |
| **Admin** | An administrative user who logs into the Dashboard to manage system configurations, Employee profiles, and attendance data. | Superadmin, manager, dashboard user |

## Access Control & IoT Hardware

| Term | Definition | Aliases to avoid |
| :--- | :--- | :--- |
| **Access Controller** | The physical IoT hardware unit (ESP32-based) consisting of an NFC reader, servo motor, buzzer, and status LED. | Hardware, ESP32 reader, gate device |
| **Access Request** | A network request initiated by swiping a card, sending the identifier to the Serverless API Layer. | Swipe, check request, API ping |
| **NFC Card UID** | The unique 8-character hexadecimal identifier of a physical card read by the Access Controller. | RFID UID, Card ID, RFID tag, Mã thẻ |
| **Access Result** | The response returned from the Serverless API Layer (`GRANTED` or `DENIED`) indicating whether physical entry is permitted. | Access code, status response, OK/DENIED |
| **Door State** | The physical or logical status indicating whether the entry door is locked/closed or unlocked/open. | Lock status, barrier mode |

## Attendance Tracking

| Term | Definition | Aliases to avoid |
| :--- | :--- | :--- |
| **Attendance Record** | A single day's attendance data for an Employee, containing check-in, check-out, and calculated status. | Row entry, attendance row, attendance log |
| **Check-in** | The first recorded card swipe of an Employee on a given workday, representing their arrival. | Time-in, swipe-in, entry check |
| **Check-out** | The subsequent card swipe(s) of an Employee on the same workday, representing their departure. | Time-out, swipe-out, exit check |
| **Shift Start Time** | The configured start time of an Employee's workday, used as the benchmark to calculate punctuality. | Ca làm việc, SHIFTSTART, shift starting |
| **Attendance Status** | The calculated punctuality evaluation for an Employee's daily check-in (`ON_TIME`, `LATE`, or `ABSENT`). | Status, punctuality status, record state |
| **Employee Status** | The administrative state of an Employee profile determining active physical permissions (`active` or `inactive`). | Status, user status, card status |
| **Late Threshold** | The permitted grace period in minutes past the Shift Start Time before a Check-in is officially flagged as `LATE`. | Late grace, threshold limit |

## System Architecture & Database

| Term | Definition | Aliases to avoid |
| :--- | :--- | :--- |
| **Serverless API Layer** | The backend API hosted on Google Apps Script (GAS) that processes requests, hashes passwords, and coordinates sheet operations. | Backend, Apps Script, GAS server |
| **Database** | The tabular cloud storage (hosted on Google Sheets) acting as the primary persistent database for the system. | Spreadsheet, Sheets DB, Google Sheets |
| **Infrastructure Client** | The frontend software module responsible for executing HTTP calls to the Serverless API Layer and caching records. | API client, sheetsClient, network layer |

---

## Relationships

- An **Employee** is assigned exactly one unique **NFC Card UID**.
- An **Employee** has exactly one **Employee Status** (`active` or `inactive`) and a specific **Shift Start Time**.
- An **Access Controller** reads an **NFC Card UID** to initiate an **Access Request**.
- The **Serverless API Layer** validates the request and creates or updates a single **Attendance Record** in the **Database** per day for that **Employee**.
- An **Attendance Record** has exactly one **Check-in** and zero-or-one **Check-out** timestamp, producing exactly one **Attendance Status**.

---

## Example dialogue

> **Dev:** "When an **Employee** swipes their physical card, does the **Access Controller** store the **Attendance Record** locally?"
>
> **Domain expert:** "No — the **Access Controller** is stateless; it reads the **NFC Card UID** and sends an **Access Request** to the **Serverless API Layer**."
>
> **Dev:** "And how does the backend determine whether to return `GRANTED` or `DENIED`?"
>
> **Domain expert:** "It checks if the **NFC Card UID** belongs to an **Employee** who is currently marked `active` under their **Employee Status** in the **Database**. If so, it returns `GRANTED` and either creates or updates their daily **Attendance Record**."
>
> **Dev:** "So if it's the first swipe of the day, it records the **Check-in**, and any subsequent swipe updates the **Check-out**?"
>
> **Domain expert:** "Precisely. The **Attendance Status** is computed instantly on **Check-in** based on whether the swipe time exceeds the **Shift Start Time** plus the configured **Late Threshold**."

---

## Flagged ambiguities

- **"User"** vs. **"Employee"** vs. **"Admin"**: The generic term "user" was used ambiguously to refer to both employees checking in and administrators managing the panel. We resolve this by strictly separating **Employee** (the person being tracked) from **Admin** (the system operator).
- **"RFID card"** vs. **"NFC card"**: Since the hardware uses high-frequency MFRC522 readers operating in the NFC spectrum and the translation keys explicitly use "NFC Card UID", we standardize on **NFC Card UID**.
- **"TIMEIN" / "TIMEOUT"** vs. **"Check-in" / "Check-out"**: The database columns are named `TIMEIN` and `TIMEOUT`. However, to align with user understanding and common interface labels, the domain concepts are canonically defined as **Check-in** and **Check-out**.
- **"Status"**: The word "Status" was overloaded. We explicitly separate **Employee Status** (active/inactive) from **Attendance Status** (ON_TIME/LATE/ABSENT) to prevent logical and operational confusion.
