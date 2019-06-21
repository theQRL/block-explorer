/* global describe, cy, beforeEach, it */

// Helpers
function isEnabledAndVisible(element) {
  cy.get(element).should('exist').and('be.visible').and('be.enabled')
}

describe('Test navigations', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/')
  })

  it('Search bar and button exist, are visible and enabled', () => {
    isEnabledAndVisible('#__blaze-root > #navbar > #qrlNavbar > .form-inline > .input-group > #searchBox')
    isEnabledAndVisible('#__blaze-root > #navbar > #qrlNavbar > .form-inline > .input-group > .input-group-append > #button-search')
  })

  it('Entering 666 into search bar and clicking button routes to correct page', () => {
    cy.get('#__blaze-root > #navbar > #qrlNavbar > .form-inline > .input-group > #searchBox').type('666')
    cy.get('#__blaze-root > #navbar > #qrlNavbar > .form-inline > .input-group > .input-group-append > #button-search').click()
    cy.url().should('eq', 'http://localhost:3000/block/666')
    cy.get('.text-center').should('have.text', 'Block 666')
  })
})
