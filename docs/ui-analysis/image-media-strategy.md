# Image And Media Strategy

## Legacy Findings

- Driver pages include photo upload preview and table/card avatar presentation.
- Vehicle pages include image upload preview and vehicle/group image rows.
- Trip detail uses a circular driver profile image.
- Brand/sidebar images are embedded or remote in legacy exports.

## Modern Strategy

- Do not copy unsafe remote resources blindly.
- Do not use exposed legacy keys or external credential-bearing URLs.
- Use generated initials for drivers when no image is attached.
- Use local placeholder vehicle silhouettes for vehicles until real file metadata exists.
- Use `FileObject` and `FileAttachment` metadata for future profile/vehicle images.
- Keep binary upload out of this design stage.

## Demo Data Recommendation

When demo data is implemented, include metadata-only attachments:

- Driver avatar file metadata linked to `driver`.
- Vehicle image file metadata linked to `vehicle`.
- Document metadata linked to licenses, vehicle documents, maintenance requests, fuel entries, and report runs.

Use local placeholder paths or generated safe demo assets only.
