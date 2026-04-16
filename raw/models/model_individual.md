{
  "customerId": "CUST-8842-910456",
  "customerType": "ORGANIZATION",
  "status": "ACTIVE",
  "createdAt": "2022-03-14T10:15:30Z",
  "updatedAt": "2026-04-10T08:45:12Z",
  "profile": {
    "individual": null,
    "organization": {
      "legalName": "Apex Manufacturing Ltd.",
      "tradeName": "Apex Tech",
      "legalStructure": "PRIVATE_LIMITED_COMPANY",
      "industryCode": "NAICS_334111",
      "incorporationDate": "2018-05-22",
      "jurisdiction": "US-DE",
      "registrationNumber": "DEL-8842910",
      "taxIdentificationNumber": "84-9920114",
      "vatNumber": "US8499201140001",
      "annualRevenue": {
        "amount": 15400000.00,
        "currency": "USD",
        "reportingYear": 2025
      },
      "employeeCount": 142,
      "authorizedSignatories": [
        {
          "fullName": "Jane Doe",
          "title": "Chief Executive Officer",
          "signingLimit": 500000.00,
          "linkedCustomerId": "CUST-8842-910001"
        },
        {
          "fullName": "John Smith",
          "title": "Chief Financial Officer",
          "signingLimit": 250000.00,
          "linkedCustomerId": "CUST-8842-910002"
        }
      ],
      "beneficialOwners": [
        {
          "fullName": "Jane Doe",
          "ownershipPercentage": 65.0,
          "linkedCustomerId": "CUST-8842-910001"
        },
        {
          "fullName": "Robert Lee",
          "ownershipPercentage": 35.0,
          "linkedCustomerId": "CUST-8842-910003"
        }
      ]
    }
  },
  "contactInformation": {
    "emails": [
      { "type": "CORPORATE", "address": "contact@apextech.com", "verified": true, "primary": true }
    ],
    "phones": [
      { "type": "BUSINESS_MAIN", "number": "+12125550198", "countryCode": "US", "verified": true, "primary": true },
      { "type": "BUSINESS_FAX", "number": "+12125550199", "countryCode": "US", "verified": false, "primary": false }
    ],
    "digitalIdentifiers": {
      "onlineBankingUsername": "apex_tech_admin",
      "apiClientId": "cli_8842910456",
      "mobileAppRegistered": true
    }
  },
  "addresses": [
    {
      "type": "REGISTERED_OFFICE",
      "line1": "100 Corporate Plaza",
      "line2": "Suite 400",
      "city": "Wilmington",
      "stateProvince": "DE",
      "postalCode": "19801",
      "country": "US",
      "startDate": "2018-05-22",
      "endDate": null,
      "primary": true
    },
    {
      "type": "OPERATIONAL",
      "line1": "450 Innovation Drive",
      "city": "San Jose",
      "stateProvince": "CA",
      "postalCode": "95134",
      "country": "US",
      "startDate": "2020-01-15",
      "endDate": null,
      "primary": false
    }
  ],
  "compliance": {
    "kycStatus": "VERIFIED",
    "kycTier": "ENHANCED",
    "lastKycReviewDate": "2025-06-10",
    "nextKycReviewDate": "2026-06-10",
    "riskRating": "MEDIUM",
    "pepStatus": false,
    "sanctionsScreening": {
      "status": "CLEAR",
      "lastScreenedAt": "2026-04-15T02:00:00Z",
      "screeningProvider": "REFINITIV_WORLD_CHECK"
    },
    "adverseMediaFlag": false,
    "documents": [
      { "type": "CERTIFICATE_OF_INCORPORATION", "docId": "DOC-99881", "status": "VALID", "expiryDate": null },
      { "type": "BOARD_RESOLUTION_AUTHORIZING_ACCOUNT", "docId": "DOC-99882", "status": "VALID", "expiryDate": "2027-03-01" }
    ]
  },
  "accounts": [
    { "accountId": "ACC-10004522", "productType": "COMMERCIAL_CHECKING", "status": "ACTIVE", "openDate": "2022-03-20", "currency": "USD" },
    { "accountId": "ACC-10004523", "productType": "BUSINESS_SAVINGS", "status": "ACTIVE", "openDate": "2022-04-05", "currency": "USD" },
    { "accountId": "ACC-10005110", "productType": "COMMERCIAL_LINE_OF_CREDIT", "status": "ACTIVE", "openDate": "2023-09-12", "currency": "USD" }
  ],
  "relationships": [
    { "relatedCustomerId": "CUST-8842-910001", "relationshipType": "KEY_EXECUTIVE", "startDate": "2018-05-22" },
    { "relatedCustomerId": "CUST-8842-910003", "relationshipType": "MAJOR_SHAREHOLDER", "startDate": "2018-05-22" }
  ],
  "preferences": {
    "language": "en-US",
    "timeZone": "America/New_York",
    "communicationPreferences": {
      "statements": "ELECTRONIC",
      "notifications": ["EMAIL", "SMS"],
      "marketingConsent": false,
      "consentVersion": "v2.1",
      "consentGrantedAt": "2022-03-14T10:15:30Z"
    }
  }
}