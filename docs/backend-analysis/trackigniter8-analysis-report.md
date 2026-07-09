# Trackigniter8 Analysis Report

## Executive Summary
Trackigniter8 is a static HTML export of a multi-module fleet and tracking system. I found 95 HTML pages, 31 meaningful functional page groups, roughly 127 meaningful backend-facing forms after filtering duplicated/plugin noise, and about 95 meaningful tables/list views with recognizable business columns.

The strongest rebuild path is:
- backend first
- API-first domain modeling
- gradual frontend conversion

Recommended stack:
- Node.js
- Fastify
- TypeScript
- PostgreSQL
- Prisma
- Redis
- JWT plus RBAC

## Folder Structure

Top-level pages:
- accounts.html
- alerts.html
- attendance.html
- backup.html
- chat.html
- coupon.html
- customer.html
- dashboard.html
- dispatch.html
- drivers.html
- fuel.html
- geofence.html
- import.html
- incidents.html
- languages.html
- maintenance.html
- payroll.html
- reminder.html
- resetpassword.html
- route_planner.html
- stockinventory.html
- tracking.html
- trips.html
- tyres.html
- users.html
- vehicle.html
- vehiclevendors.html
- whatsapp_settings.html

Subfolders/modules present:
- accounts
- customer
- drivers
- fuel
- geofence
- login
- maintenance
- reminder
- reports
- settings
- stockinventory
- tracking
- trips
- users
- vehicle
- vehiclevendors

## Module Inventory
- Dashboard: 1 page
  - dashboard.html
- Tracking: 2 pages
  - tracking.html
  - tracking/livestatus.html
- Vehicles: 4 pages
  - vehicle.html
  - vehicle/addvehicle.html
  - vehicle/vehiclegroup.html
  - vehicle/vehicleroute.html
- Drivers: 3 pages
  - drivers.html
  - drivers/adddrivers.html
  - drivers/performance.html
- Trips: 14 pages
  - trips.html
  - trips/addtrips.html
  - trips/details/*.html detail pages
- Dispatch: 1 page
  - dispatch.html
- Geofence: 3 pages
  - geofence.html
  - geofence/addgeofence.html
  - geofence/geofenceevents.html
- Maintenance: 6 pages
  - maintenance.html
  - maintenance/addmaintenance.html
  - maintenance/analytics.html
  - maintenance/pms.html
  - maintenance/mechanic.html
  - maintenance/maintenance_vendor.html
- Fuel: 2 pages
  - fuel.html
  - fuel/addfuel.html
- Reports: 14 pages
  - booking, couponreport, driver_performance, driversreport, fuels, geofencereport, incomeexpense, maintenancereport, profitability, remindersreport, topexpense, topincome, toproutes, topvehicles
- Users: 2 pages
  - users.html
  - users/adduser.html
- Settings: 13 pages
  - website, Traccar, SMTP, SMS, templates, frontend content, language switch, cron, menu/mobile log related pages
- Accounts: 5 pages
  - accounts list, add transactions, category, transactions, transfers
- Customers: 2 pages
  - customer list
  - customer/addcustomer.html
- Reminders: 4 pages
  - reminder list, add reminder, services, calendar
- Stock Inventory: 3 pages
  - stock list, add stock, purchase history
- Payroll: 1 page
  - payroll.html
- Alerts: 1 page
  - alerts.html
- Route Planner: 1 page
  - route_planner.html
- Additional modules found:
  - attendance
  - backup
  - chat
  - coupon
  - import
  - incidents
  - languages
  - login
  - resetpassword
  - tyres
  - vehiclevendors
  - whatsapp_settings

## Detected Technologies
- Bootstrap/AdminLTE-style layout across nearly all pages
- jQuery
- DataTables
- Select2
- Google Maps references
- Leaflet references on tracking/geofence/dashboard areas
- light Mapbox traces
- Traccar integration hints
- Font Awesome
- Chart.js on a few pages
- FullCalendar on reminder/calendar surface
- external hosts referenced: codeforts.com, maps.googleapis.com, ui-avatars.com, fonts.googleapis.com, fonts.gstatic.com

## Authentication And RBAC Findings
- login page export is `login/logout.html`
- login form posts to `https://codeforts.com/trackigniter8/login/login_action`
- fields found: username, password, remember checkbox
- reset page is `resetpassword.html`
- reset action posts to `https://codeforts.com/trackigniter8/Resetpassword/resetpasswordsave`
- fields found: password, cnfpassword
- role/permission hints are explicit in user creation and repeated across layout strings
- visible role labels found: Admin, Driver, Customer
- user creation page stores permissions as granular checkboxes such as:
- vehicle list/add/delete/group
- drivers list/add/delete
- trips list/add/delete
- route, customer, fuel, maintenance, mechanic, vendor, parts
- reminders, dashboard, reports, settings
- geofence list/add/delete/events
- live location, tracking, stock, coupon, accounts, vehicle vendors

## Tracking And Map Findings
- tracking pages:
- tracking.html
- tracking/livestatus.html
- geofence.html
- geofence/addgeofence.html
- geofence/geofenceevents.html
- route_planner.html
- dashboard.html also includes vehicle/geofence status views
- map libraries detected:
- Google Maps
- Leaflet
- minor Mapbox traces
- Traccar integration page:
- settings/websitesetting_traccar.html
- fields: s_traccar_enabled, s_traccar_url, s_traccar_username, s_traccar_password
- geofence payload hints:
- geo_name
- geo_description
- geo_vehicles[]
- geo_notify_type
- geo_notify_members[]
- geo_area
- tracking filter form hints:
- vehicle selector
- fromdate
- todate
- likely supports history/playback or filtered location report

## Forms Inventory
Meaningful add/edit/config forms found:

- `login/logout.html`
  - purpose: login
  - action: login/login_action
  - fields: username, password, remember

- `resetpassword.html`
  - purpose: password reset
  - action: Resetpassword/resetpasswordsave
  - fields: password, cnfpassword

- `vehicle/addvehicle.html`
  - purpose: create vehicle
  - action: vehicle/insertvehicle
  - major fields: file, v_registration_no, v_name, v_type, v_color, v_is_active, v_fuel_type, v_fuel_efficiency, v_opening_fuel, v_fuel_level, v_group, v_driver, v_model, v_manufactured_by, v_chassis_no, v_engine_no, load-capacity/seat/bed variants, v_reg_exp_date, v_ins_exp_date, doc_names[], doc_files[], v_default_billing_type, v_defaultcost, v_ownership, v_vendor_name, lease dates, v_traccar_id, v_api_username, created metadata
  - import form also present: vehicle/import_csv

- `vehicle/vehiclegroup.html`
  - purpose: create/update vehicle group
  - actions: vehicle/addgroup, vehicle/updategroup
  - fields: gr_name, gr_desc, group_image, gr_visibletobooking

- `vehicle/vehicleroute.html`
  - purpose: create vehicle route
  - action: vehicle/addroute
  - fields: vr_name

- `vehiclevendors/addvehiclevendors.html`
  - purpose: create vehicle vendor
  - action: vehiclevendors/insertvehiclevendor
  - fields: vn_name, vn_contact_person, vn_mobile, vn_doj, vn_is_active, file, vn_address

- `drivers/adddrivers.html`
  - purpose: create driver
  - action: drivers/insertdriver
  - fields: webcam_photo_data, file, d_name, d_mobile, d_email, d_is_active, d_age, d_password, d_doj, d_licenseno, d_license_expdate, doc_names[], doc_files[], d_total_exp, d_ref, d_address, d_payment_type, d_monthly_salary, d_daily_wage, d_commission_type, d_commission_rate
  - import form also present: drivers/import_csv

- `customer/addcustomer.html`
  - purpose: create customer
  - action: customer/insertcustomer
  - fields: c_name, c_mobile, c_whatsapp_number, same_as_mobile, c_email, c_pwd, c_address, c_whatsapp_notifications

- `trips/addtrips.html`
  - purpose: create trip/booking
  - action: Trips/inserttrips
  - fields include: t_type, t_vechicle, t_driver, t_customer_id, start/end/return dates, from/to locations, stop arrays, distance/time, fuel math, meter readings, status, billing type/rate/qty/tax/discount/final amount, email/sms/whatsapp flags, origin/destination lat/lng, booking source

- `maintenance/addmaintenance.html`
  - purpose: create maintenance job
  - action: maintenance/insertmaintenance
  - fields: m_v_id, m_status, m_start_date, m_end_date, m_service_info, job_card tasks, pu_s_id[], pu_qty[], m_cost, m_vendor_id, m_receipt_file, m_mechanic_id, m_priority, m_notify_members[], m_notify_type

- `maintenance/mechanic.html`
  - purpose: create/update mechanic
  - actions: maintenance/addmechanic, maintenance/updatemechanic
  - fields: mm_name, mm_email, mm_phone, mm_category

- `maintenance/maintenance_vendor.html`
  - purpose: create/update maintenance vendor
  - actions: maintenance/addmaintenance_vendor, maintenance/updatemaintenance_vendor
  - fields: mv_name, mv_email, mv_phone

- `maintenance/pms.html`
  - purpose: create preventive maintenance schedule
  - action: maintenance/add_pms
  - fields: pm_v_id, pm_service_name, pm_interval_km, pm_interval_days

- `fuel/addfuel.html`
  - purpose: add fuel entry
  - action: fuel/insertfuel
  - fields: v_id, v_fueladdedby, v_fuel_type, v_fuelfilldate, v_fuel_quantity, v_odometerreading, v_fuelprice, v_fuelsource, v_fuelvendor, fuel_image, v_fuelcomments

- `stockinventory/addstockinventory.html`
  - purpose: create stock item
  - action: stockinventory/insertstockinventory
  - fields: s_name, s_desc, s_stock, s_price, s_status

- `accounts.html`
  - purpose: create/update account
  - actions: accounts/add, accounts/update
  - fields: account_name, balance, status, id

- `accounts/addtransactions.html`
  - purpose: add account transaction
  - action: accounts/inserttransactions
  - fields: transaction_type, account_id, cat_id, amount, note, transaction_date, reference_number, transactionsv_id

- `accounts/transfers.html`
  - purpose: transfer funds
  - action: accounts/execute_transfer
  - fields: from_account, to_account, amount, note, transfer_date, reference_number

- `coupon.html`
  - purpose: create/update coupon
  - actions: coupon/add, coupon/update
  - fields: cp_code, cp_discount, cp_start_date, cp_end_date, cp_usage_limit, cp_discount_method, cp_status

- `users/adduser.html`
  - purpose: create staff user with RBAC
  - action: users/insertuser
  - fields: basic identity/login fields plus a large permissions matrix

- `reminder/addreminder.html`
  - purpose: create reminder
  - action: reminder/insertreminder
  - fields: r_v_id, r_date, r_services[], r_message

- `geofence/addgeofence.html`
  - purpose: create geofence
  - action: geofence/geofence_save
  - fields: geo_name, geo_description, geo_vehicles[], geo_notify_type, geo_notify_members[], geo_area

- `alerts.html`
  - purpose: save alert configuration
  - action: alerts/save_config
  - fields: ac_type, ac_notification_method, ac_alert_frequency, ac_recipients_text, and threshold/limit fields

- `payroll.html`
  - purpose: payroll settlement filter/settle flow
  - action: payroll/settle
  - fields: driver_id, month, year

- `tracking.html`
  - purpose: tracking filter
  - action: not set in export
  - fields: t_vechicle, fromdate, todate

- `settings/websitesetting.html`
  - purpose: site/system settings
  - action: settings/websitesetting_save
  - fields include company/contact data, timezone, menu/layout colors, module view toggles, invoice options, map provider/key/default lat/lng, routing engine, fuel price, icon/logo, FCM JSON

- `settings/websitesetting_traccar.html`
  - purpose: Traccar integration settings
  - action: settings/traccarconfigsave
  - fields: s_traccar_enabled, s_traccar_url, s_traccar_username, s_traccar_password

- `settings/smtpconfig.html`
  - purpose: SMTP config
  - action: settings/smtpconfigsave
  - fields: smtp_host, smtp_auth, smtp_uname, smtp_pwd, smtp_issecure, smtp_port, smtp_emailfrom, smtp_replyto
  - test form: settings/smtpconfigtestemail

- `settings/smsconfig.html`
  - purpose: SMS/Twilio config
  - action: settings/twilioconfigsave
  - fields: ss_is_active, ss_account_sid, ss_auth_token, ss_number
  - test form: settings/twilioconfigtestsms

## Tables Inventory
High-signal list/table pages found:

- `vehicle.html`
  - columns: Vehicle | Driver & Fuel | Group & Owner | Status & Expiry | Action

- `drivers.html`
  - columns: # | Photo | Name | Contact | License No | License Expiry | Status | Action

- `customer.html`
  - columns: S.No | Name | Mobile | Email | Address | Outstanding Payment | Status | Action

- `fuel.html`
  - columns: # | Date | Vehicle | Quantity | Cost | Filled By | Odometer | Fuel Receipt | Action

- `maintenance.html`
  - columns: # | Vehicle | Priority | Date | Vendor | Service Info | Cost | Status | Action
  - related nested tables: Part Name | Cost | Qty

- `stockinventory.html`
  - columns: # | Name | Description | Stock | Price | Status | Action

- `users.html`
  - columns: S.No | Employee ID | Name | Contact | Role/Email | Last Login | Status | Action

- `geofence.html`
  - columns: Vehicle | Event | Time

- `geofence/geofenceevents.html`
  - columns: S.No | Vehicle | Geofence Management | Event Type | Timestamp

- `trips.html`
  - columns: # | Details | Customer | Route | Vehicle | Driver Name | Status | Action

- `vehiclevendors.html`
  - columns: S.No | Company | Contact Person | Mobile | Date of Contract | Contract Doc | Address | Is Active | Action

- `accounts.html`
  - columns: S.No | Enter Account Name | Total Balance | Created by | Created Date | Status | Action

- `vehicle/vehiclegroup.html`
  - columns: S.No | Vehicle Type | Description | Image | Frontend Booking | Created Date | Action

- `vehicle/vehicleroute.html`
  - columns: S.No | Name | Created Date | Action

- `maintenance/mechanic.html`
  - columns: # | Name | Email | Phone | Category | Created Date | Action

- `maintenance/maintenance_vendor.html`
  - columns: # | Name | Email | Phone | Created Date | Action

- `maintenance/pms.html`
  - columns: Vehicle | Service | Interval | Last Service | Action

- `coupon.html`
  - columns: # | Code | Discount | Validity | Usage | Days Remaining | Status | Actions

- `alerts.html`
  - columns: Criteria | Frequency | Type | Status | Method | Recipients | Actions
  - alert history columns: Time | Type | Subject | Recipient | Method | Status

- `payroll.html`
  - columns: Driver | Period | Amount | Status | Date

- `dashboard.html`
  - tables/widgets found:
  - Issue Type | Count | Action
  - Name | Status
  - Vehicle | Geofence | Entry | Duration
  - Vehicle | Status

Report pages exist but the export did not preserve stable table headers for most of them; they appear to be filter/export screens whose real data is likely server-rendered or AJAX-fed at runtime.

## Inferred Data Models
See [data-models.md](/C:/Users/cs_in/projects/trackigniter8/docs/backend-analysis/data-models.md).

High-confidence entities:
- users, roles, permissions
- vehicles, vehicle_groups, vehicle_routes, vehicle_vendors, tyres
- drivers, driver_documents, driver_performance_metrics
- customers
- trips, trip_stops, trip_documents, trip_payments, trip_expenses, dispatch_jobs
- gps_devices, vehicle_positions, geofences, geofence_events, route_plans
- maintenance_records, maintenance_job_cards, maintenance_parts_used, mechanics, maintenance_vendors, pms_schedules
- fuel_entries
- accounts, account_categories, account_transactions, account_transfers
- stock_items
- payroll_settlements
- reminders, reminder_services
- alert_configs, alert_logs
- settings and integration config tables

## Inferred APIs
Backend/action hints found in forms:
- login/login_action
- Resetpassword/resetpasswordsave
- vehicle/insertvehicle
- vehicle/import_csv
- vehicle/addgroup
- vehicle/updategroup
- vehicle/addroute
- vehiclevendors/insertvehiclevendor
- drivers/insertdriver
- drivers/import_csv
- drivers/resetpassword
- customer/insertcustomer
- Trips/inserttrips
- maintenance/insertmaintenance
- maintenance/addmechanic
- maintenance/updatemechanic
- maintenance/addmaintenance_vendor
- maintenance/updatemaintenance_vendor
- maintenance/add_pms
- fuel/insertfuel
- stockinventory/insertstockinventory
- accounts/add
- accounts/update
- accounts/inserttransactions
- accounts/execute_transfer
- coupon/add
- coupon/update
- users/insertuser
- reminder/insertreminder
- geofence/geofence_save
- alerts/save_config
- payroll/settle
- settings/websitesetting_save
- settings/traccarconfigsave
- settings/smtpconfigsave
- settings/smtpconfigtestemail
- settings/twilioconfigsave
- settings/twilioconfigtestsms

Normalized API draft is in [api-design.md](/C:/Users/cs_in/projects/trackigniter8/docs/backend-analysis/api-design.md).

## Backend Rebuild Roadmap
1. Foundation
   - auth
   - users
   - roles
   - permissions
   - settings
   - integration secret storage
2. Fleet master data
   - vehicles
   - vehicle groups
   - routes
   - vehicle vendors
   - drivers
   - customers
3. Operations core
   - trips
   - dispatch
   - trip payments
   - trip expenses
4. Operations support
   - fuel
   - maintenance
   - PMS
   - reminders
   - stock
5. Tracking platform
   - Traccar integration
   - GPS devices
   - live positions
   - geofences
   - route planner
6. Finance and reporting
   - accounts
   - payroll
   - reports
   - alerts
   - exports

## Frontend Migration Roadmap
See [frontend-conversion-plan.md](/C:/Users/cs_in/projects/trackigniter8/docs/backend-analysis/frontend-conversion-plan.md).

Recommended order:
1. auth shell
2. dashboard
3. vehicles, drivers, customers
4. trips and dispatch
5. maintenance and fuel
6. tracking, geofence, route planner
7. accounts, payroll, stock, alerts
8. reports and settings

## Risks And Legal Notes
- this looks like an exported HTML snapshot from a hosted product referencing codeforts.com/trackigniter8
- do not copy proprietary backend code from the original system
- the export contains duplicated shared layout/plugin markup, so not every form/table corresponds to a unique backend concern
- tracking/geofence behavior may depend on Traccar/provider semantics not fully visible in static HTML
- financial, payroll, and alert rules need stakeholder validation before schema freeze

## Recommended Next Step
Stage 02 should scaffold the backend repo and implement:
- auth
- users/roles/permissions
- settings/integrations
- vehicles
- drivers
- customers

That gives a stable base before trips, tracking, and finance modules are added.
