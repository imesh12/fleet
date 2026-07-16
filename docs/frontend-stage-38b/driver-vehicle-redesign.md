# Driver And Vehicle Redesign

Vehicle updates:

- Vehicle list now emphasizes registration identity and semantic status.
- Vehicle detail has a visual vehicle card, profile hero, compliance/device/document/odometer summary cards, assignment card, and existing metadata workflows.
- Existing vehicle create/edit routes and metadata managers remain intact.

Driver updates:

- Driver list now includes avatar/initials presentation and semantic status.
- Driver detail has a profile hero, employment metadata, license/document/compliance/skills summary cards, assignment card, and existing metadata workflows.
- Existing driver create/edit routes and metadata managers remain intact.

Image strategy:

- Uses generated initials and safe placeholders only.
- Does not fetch unsafe legacy image URLs.
- Future image binding should use `FileObject` and `FileAttachment` metadata.
