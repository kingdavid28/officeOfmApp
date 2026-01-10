# Office OFM App Guidelines

## General Development Guidelines

* Use React functional components with hooks
* Implement responsive layouts using CSS Grid and Flexbox
* Keep components small and focused on single responsibilities
* Use TypeScript for type safety
* Follow Firebase best practices for authentication and data management
* Implement proper error handling and loading states
* Use environment variables for all configuration

## Code Organization

* Components in `/src/components/`
* Pages in `/src/pages/`
* Firebase utilities in `/src/utils/firebase/`
* Custom hooks in `/src/hooks/`
* Types in `/src/types/`
* Constants in `/src/constants/`

## Firebase Integration

* Always use Firebase Auth for user authentication
* Implement proper security rules for Firestore
* Use real-time listeners for live data updates
* Handle offline scenarios gracefully
* Implement proper data validation before Firebase operations

## UI/UX Guidelines

* Use consistent spacing (8px grid system)
* Implement loading spinners for async operations
* Show clear error messages to users
* Use confirmation dialogs for destructive actions
* Ensure mobile-first responsive design

## Security Guidelines

* Never expose Firebase config in client-side code beyond what's necessary
* Validate all user inputs
* Implement proper authentication checks on protected routes
* Use Firestore security rules to protect data
* Sanitize user-generated content

## Testing Guidelines

* Write unit tests for utility functions
* Test components with React Testing Library
* Mock Firebase services in tests
* Maintain minimum 80% code coverage

## Performance Guidelines

* Implement code splitting for route-based components
* Use React.memo for expensive components
* Optimize Firebase queries with proper indexing
* Implement image optimization and lazy loading

## Deployment Guidelines

* Use environment-specific Firebase projects
* Implement CI/CD pipeline for automated deployments
* Monitor application performance and errors
* Keep dependencies updated and secure