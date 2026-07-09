# Trackigniter8 Backend Data Models Draft

## Basis
This draft is inferred from the exported HTML pages, form actions, field names, table headers, and module structure. It is a reconstruction plan, not a copy of any proprietary backend implementation.

## Core Identity And Access

### users
- id
- employee_id
- username
- email
- password_hash
- first_name
- last_name
- phone
- avatar_url
- role_id
- status
- last_login_at
- created_at
- updated_at

### roles
- id
- code
- name
- description
- is_system

### permissions
- id
- code
- module
- name
- description

### role_permissions
- role_id
- permission_id

### sessions
- id
- user_id
- refresh_token_hash
- ip_address
- user_agent
- expires_at
- revoked_at

## Fleet

### vehicles
- id
- registration_number
- name
- vehicle_type
- color
- is_active
- fuel_type
- fuel_efficiency
- opening_fuel
- fuel_level
- vehicle_group_id
- assigned_driver_id
- model
- manufacturer
- chassis_number
- engine_number
- load_capacity
- seat_count
- bed_size
- registration_expiry_date
- insurance_expiry_date
- billing_type
- default_cost
- ownership_type
- vendor_id
- lease_start_date
- lease_end_date
- traccar_device_id
- traccar_api_username
- created_by
- created_at
- updated_at

### vehicle_groups
- id
- name
- description
- image_url
- visible_in_booking
- created_at

### vehicle_routes
- id
- name
- created_at

### vehicle_vendors
- id
- company_name
- contact_person
- mobile
- contract_date
- contract_document_url
- address
- is_active
- created_by
- created_at

### tyres
- id
- vehicle_id
- serial_number
- position
- purchase_date
- install_date
- replacement_date
- tread_depth
- cost
- status
- notes

## Drivers And Customers

### drivers
- id
- name
- mobile
- email
- photo_url
- webcam_photo_data
- is_active
- age
- login_password_hash
- joining_date
- license_number
- license_expiry_date
- total_expense
- reference_name
- address
- payment_type
- monthly_salary
- daily_wage
- commission_type
- commission_rate
- created_by
- created_at

### driver_documents
- id
- driver_id
- document_name
- file_url

### driver_performance_metrics
- id
- driver_id
- metric_date
- trip_count
- incident_count
- fuel_efficiency_score
- punctuality_score
- overall_score

### customers
- id
- name
- mobile
- whatsapp_number
- email
- password_hash
- address
- whatsapp_notifications_enabled
- outstanding_payment
- status
- created_at

## Trips And Dispatch

### trips
- id
- trip_type
- vehicle_id
- driver_id
- customer_id
- start_date
- end_date
- return_date
- from_location
- to_location
- total_distance
- trip_time
- fuel_consumption
- fuel_cost
- optimize_route
- start_meter_reading
- end_meter_reading
- status
- billing_type
- rate
- quantity
- amount_before_tax
- tax_amount
- discount_code_id
- discount_method
- discount_value
- discount_amount
- final_amount
- amount
- booking_email_enabled
- booking_sms_enabled
- whatsapp_notification_enabled
- from_latitude
- from_longitude
- to_latitude
- to_longitude
- created_by
- created_at
- booking_source

### trip_stops
- id
- trip_id
- sequence_no
- stop_name
- latitude
- longitude

### trip_documents
- id
- trip_id
- document_name
- file_url

### trip_payments
- id
- trip_id
- amount
- payment_date
- payment_method
- reference_number
- notes

### trip_expenses
- id
- trip_id
- part_or_service_name
- quantity
- unit_cost
- total_cost
- expense_date
- notes

### dispatch_jobs
- id
- trip_id
- vehicle_id
- driver_id
- dispatcher_user_id
- status
- priority
- assigned_at
- notes

## Tracking And Geospatial

### gps_devices
- id
- vehicle_id
- provider
- external_device_id
- username
- status
- last_seen_at

### vehicle_positions
- id
- vehicle_id
- gps_device_id
- recorded_at
- latitude
- longitude
- speed_kph
- heading
- status
- raw_payload_json

### geofences
- id
- name
- description
- notify_type
- geometry_json
- created_by
- updated_at

### geofence_vehicles
- geofence_id
- vehicle_id

### geofence_notification_members
- geofence_id
- user_id

### geofence_events
- id
- geofence_id
- vehicle_id
- event_type
- occurred_at
- latitude
- longitude

### route_plans
- id
- vehicle_id
- driver_id
- from_location
- to_location
- geometry_json
- optimized
- created_at

## Maintenance And Fuel

### maintenance_records
- id
- vehicle_id
- status
- start_date
- end_date
- service_info
- cost
- maintenance_vendor_id
- receipt_file_url
- mechanic_id
- priority
- notify_type
- created_at

### maintenance_job_cards
- id
- maintenance_record_id
- task
- completed

### maintenance_parts_used
- id
- maintenance_record_id
- stock_item_id
- quantity
- unit_cost

### maintenance_vendors
- id
- name
- email
- phone
- created_at

### mechanics
- id
- name
- email
- phone
- category
- created_at

### pms_schedules
- id
- vehicle_id
- service_name
- interval_km
- interval_days

### fuel_entries
- id
- vehicle_id
- filled_by_driver_id
- fuel_type
- fill_date
- quantity
- odometer_reading
- fuel_price
- source_type
- vendor_name
- receipt_image_url
- comments
- created_at

## Finance, Inventory, And Payroll

### accounts
- id
- account_name
- balance
- status
- created_by
- created_at

### account_categories
- id
- name
- transaction_type
- status

### account_transactions
- id
- transaction_type
- account_id
- category_id
- amount
- note
- transaction_date
- reference_number
- vendor_id
- created_at
- created_by

### account_transfers
- id
- from_account_id
- to_account_id
- amount
- note
- transfer_date
- reference_number
- created_at
- created_by

### coupons
- id
- code
- discount_value
- start_date
- end_date
- usage_limit
- discount_method
- status

### stock_items
- id
- name
- description
- stock_quantity
- price
- status

### payroll_settlements
- id
- driver_id
- month
- year
- amount
- status
- settled_at

## Reminders, Alerts, And Communication

### reminders
- id
- vehicle_id
- due_date
- message
- status
- created_at

### reminder_services
- id
- name
- description
- interval_days
- is_active

### alert_configs
- id
- criteria_type
- alert_type
- notification_method
- frequency
- recipients_text
- days_before
- threshold_percentage
- speed_limit_kmh
- idle_minutes
- delay_minutes
- max_hours
- start_time
- end_time
- deviation_km
- is_active

### alert_logs
- id
- alert_config_id
- event_time
- subject
- recipient
- method
- status

### email_templates
- id
- code
- subject
- body_html
- updated_at

### sms_templates
- id
- code
- body_text
- updated_at

## Settings And Integrations

### app_settings
- id
- group_key
- setting_key
- setting_value
- value_type
- updated_at

### traccar_configs
- id
- enabled
- server_url
- username
- password_encrypted
- updated_at

### smtp_configs
- id
- host
- auth_enabled
- username
- password_encrypted
- is_secure
- port
- email_from
- reply_to
- updated_at

### sms_configs
- id
- enabled
- account_sid
- auth_token_encrypted
- sender_number
- updated_at

## Relationships
- users belongs to roles through role_id
- roles belongs to many permissions through role_permissions
- vehicles belongs to vehicle_groups, vehicle_vendors, and optionally drivers
- drivers may also have corresponding portal users
- trips belongs to vehicles, drivers, and customers
- trip_stops, trip_documents, trip_payments, and trip_expenses belongs to trips
- gps_devices belongs to vehicles; vehicle_positions belongs to gps_devices and vehicles
- geofences belongs to many vehicles and many users through join tables
- maintenance_records belongs to vehicles, mechanics, and maintenance_vendors
- account_transactions and payroll_settlements connect operations to finance

## Suggested Enums
- role_code: super_admin, admin, dispatcher, operations, accountant, driver_manager, viewer
- user_status: active, inactive, suspended
- vehicle_type: mini_truck, mini_bus, open_body_truck, car, van, bus, truck, other
- vehicle_status: active, inactive, in_trip, maintenance, retired
- ownership_type: owned, leased, vendor_managed
- payment_type: salary, daily_wage, commission, mixed
- trip_status: draft, scheduled, dispatched, in_progress, completed, cancelled, settled
- billing_type: flat_rate, per_km, per_day, per_hour, per_quantity, contract
- geofence_event_type: enter, exit, dwell
- maintenance_priority: low, medium, high, urgent
- maintenance_status: open, in_progress, completed, cancelled
- fuel_source_type: pump, vendor, internal, other
- transaction_type: credit, debit
- coupon_discount_method: fixed, percent
- notification_method: email, sms, whatsapp, in_app

## Module Mapping
- Dashboard: vehicles, trips, geofence_events, alerts, reminders
- Tracking: gps_devices, vehicle_positions, route_plans
- Vehicles: vehicles, vehicle_groups, vehicle_routes, vehicle_vendors, tyres
- Drivers: drivers, driver_documents, driver_performance_metrics
- Trips: trips, trip_stops, trip_payments, trip_expenses, dispatch_jobs
- Geofence: geofences, geofence_vehicles, geofence_notification_members, geofence_events
- Maintenance: maintenance_records, maintenance_job_cards, maintenance_parts_used, mechanics, maintenance_vendors, pms_schedules
- Fuel: fuel_entries
- Accounts: accounts, account_categories, account_transactions, account_transfers
- Customers: customers
- Reminders: reminders, reminder_services
- Stock Inventory: stock_items
- Payroll: payroll_settlements
- Alerts: alert_configs, alert_logs
- Settings: app_settings, traccar_configs, smtp_configs, sms_configs, templates
