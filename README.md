# AncestryArc

A modern, highly interactive, and visually stunning React application for mapping out massive family trees. Built with an emphasis on speed, scale, and dynamic relationships.

## Key Features

- **Global Web View**: View hundreds of family members at once in a physics-based, interactive web diagram (`react-force-graph-2d`). Nodes automatically pack into a tight globe layout, displaying user initials or avatars.
- **Traditional Lineage Tree View**: Clicking any person transitions into a perfectly orthogonal, top-down, classic family tree layout (`@xyflow/react` + `dagre`). It dynamically builds a subset of the family tree showing parents, grandparents, children, grandchildren, siblings, and spouses.
- **Complex Relationships**: Naturally handles step-parents, half-siblings, and multiple marriages without layout breaking. Spouses are cleanly bridged via horizontal relationship lines.
- **Smart Data Entry**: Includes intuitive copy/paste clipboards for System IDs.
- **Co-Parent Suggestions**: When editing a person, the system intelligently analyzes shared children to automatically suggest missing spouse IDs.
- **Bulk Data Ingestion**: Add dozens of people at once via CSV/JSON format, complete with a temporary-to-system ID mapping engine.
- **Permissions Framework**: Foundational security allowing only the creator (`currentUser`) of a record to edit or delete it.

## Installation & Setup

1. **Prerequisites**: Ensure you have Node.js and `npm` installed.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start Development Server**:
   ```bash
   npm run dev
   ```
4. **Open in Browser**: Navigate to `http://localhost:5173`.

## Upcoming Roadmap & Next Steps

The following features are planned for future development phases:

- [ ] **Add Firebase for Authentication**: Replace the mock `currentUser` with real, persistent Google/Email authentication.
- [ ] **Approvals & Notifications**: If someone claims to be related to you (parent, child, spouse), a notification allows you to validate/approve the link. Unapproved relationships display as dotted lines, and if rejected (unapproved by 2), they will not attach in the dashboard.
- [ ] **Enable public vs. private handling**: Allow users to keep certain sub-branches or specific fields entirely private and hidden from the public global web.
- [ ] **Enable Full Encryption**: Ensure sensitive personal data (DOB, Addresses) are encrypted at rest.
- [ ] **Enable Quick Create using Text [DAG]**: Implement an AI or text-parser to instantly generate a family tree from a single paragraph of text (e.g., "John is married to Jane, they have a son Mark...").
- [ ] **Best Picture Storage Options**: Integrate a dedicated blob storage (like AWS S3 or Firebase Storage) for avatar uploads rather than relying solely on external URLs.
- [ ] **Better Dashboard**: Implement advanced filtering, timeline events, and graphical statistics on the dashboard.
- [ ] **Country as a Column**: Track geolocation and migrations natively.
- [ ] **Popular Lineages**: Highlight historically significant or massive branches within the graph.
