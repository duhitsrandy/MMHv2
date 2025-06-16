export default function PrivacyPolicyPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Privacy Policy
          </h1>
          <div className="mt-8 prose prose-lg prose-gray dark:prose-invert max-w-none">
            <p className="italic">Last Updated: June 10, 2025</p>
  
            <p>
              Your privacy is important to us at MeetMeHalfway. This Privacy Policy explains what information we collect from you, how we use and share it, and your rights regarding that information. By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with our handling of your data as described here, please do not use MeetMeHalfway.
            </p>
            <p>
              For purposes of this Policy, "MeetMeHalfway," "we," "us," or "our" refers to the sole proprietorship owned by Randy Rhubart that operates the MeetMeHalfway application and website. The term "Service" refers to the MeetMeHalfway website, app, and related services. "You" refers to individuals using our Service.
            </p>

            <h2><strong>Information We Collect</strong></h2>
            <p>
              We collect several types of information in order to provide and improve the Service. This includes:
            </p>
            <ul>
              <li><strong>Account Information:</strong> When you sign up for an account, we collect your email address and password (handled securely via our authentication provider, Clerk). We may also collect your name or display name if you choose to provide it, and any profile photo or avatar you upload (if such feature is available). The email is required for account creation and acts as your login identifier and contact point.</li>
              <li><strong>Location Inputs:</strong> To find midpoint locations, you enter addresses or locations into the Service. We collect those <strong>addresses and location queries</strong> that you input. This can include street addresses, city names, landmarks, or any other location identifiers you provide. We also collect the results of those queries (for example, the geocoded latitude/longitude coordinates of the addresses).</li>
              <li><strong>Saved Places and Preferences:</strong> If the Service allows you to save favorite locations or Points of Interest (POIs), we will store those saved places for your convenience. This might include labels or nicknames you give to addresses (e.g. "Home", "Work") and the coordinates associated with them. We also store any user-specific settings or preferences (such as preferred distance units, map settings, or recently used locations for quick access).</li>
              <li><strong>Routing Data:</strong> When you request a midpoint or directions, we calculate routes and travel times. We may log the fact that you requested a route between general areas (e.g. city to city and the chosen midpoint), including mode of transportation (driving, walking, etc.), to improve our algorithms. However, we do not continuously track your real-time GPS location; we only use the locations you manually input.</li>
              <li><strong>Usage Data:</strong> We collect information about how you use our Service. This includes:</li>
                <ul>
                  <li><strong>Log Data:</strong> Our servers automatically record certain information ("log files") when you use the Service. This log data may include your IP address, device type, browser type, the pages or screens of our Service that you visit, the date and time of your visit, and the amount of time spent on those pages. It may also record actions you take (e.g. searching for a location, clicking a suggested venue, etc.).</li>
                  <li><strong>Analytics Data:</strong> Through our analytics provider (PostHog), we gather events and usage metrics such as which features are used most often, how users navigate through the app, and error or crash reports. This data helps us understand aggregate user behavior. Analytics data is typically associated with a random unique user ID (which is not your real name) and is not intended to profile you individually.</li>
                </ul>
              <li><strong>Cookies and Local Storage:</strong> We use cookies and similar technologies (like browser local storage) to operate the Service:</li>
                <ul>
                    <li>A cookie is a small data file that our site saves on your browser. We use cookies to keep you logged in (session management) and to remember preferences. For example, after you sign in, a cookie allows us to recognize your browser so you don't have to log in again every time.</li>
                    <li>We also use local storage (a browser-based storage) to temporarily save state like your input addresses or selected options, which makes the app faster and more responsive. For example, if you add multiple locations, we might cache those in your browser so you can easily re-use them.</li>
                    <li>Some cookies are used by our analytics (PostHog) to distinguish users (using an anonymous identifier) and to track aggregate usage. We do <strong>not</strong> use cookies for third-party advertising at this time (since we currently do not serve ads).</li>
                    <li>For more details, see "Cookies and Tracking Technologies" below.</li>
                </ul>
              <li><strong>Payment and Subscription Information:</strong> If you subscribe to a paid tier, we (through Stripe) collect billing information. This includes:</li>
                <ul>
                    <li>Your payment method details (e.g. credit card number, expiration) – note, this information is collected directly by <strong>Stripe</strong>, not by MeetMeHalfway servers. We do _not_ store full credit card numbers or security codes.</li>
                    <li>Your billing name, address, and ZIP/postal code, if required for payment processing or tax calculation.</li>
                    <li>Subscription status and history – we keep track of your subscription tier, the start and end dates of your subscriptions, and any transactions (payments, refunds) associated with your account. We may also store non-sensitive metadata returned by Stripe, such as the last4 digits of your card or card type (for display in your account settings), and a Stripe customer ID or subscription ID for reference.</li>
                </ul>
              <li><strong>IP Address and Device Info:</strong> When you use the Service, we record your IP address as part of routine web request handling. The IP may be used for security (for example, to detect unusual account access or for rate limiting via our Upstash Redis store). We may derive an approximate location from your IP (city or region level) to, for instance, pre-fill your location or understand where our users are generally located (this is not always accurate). We also collect basic device and browser information through analytics and logs, such as your browser version, operating system, device model (if using a mobile app), and screen resolution. This helps us ensure the Service works well across different devices and to troubleshoot issues.</li>
            </ul>
            <p>
              <strong>Sensitive Personal Data:</strong> We do not intentionally collect any sensitive categories of data such as social security numbers, government ID numbers, racial or ethnic origin, biometric data, health information, or similar through the Service. Please do not input any such sensitive personal information into the Service. The addresses/locations you provide could be considered personal if, for example, they include your home or workplace – treat that as personal data which we protect as described here.
            </p>

            <h2><strong>How We Use Your Information</strong></h2>
            <p>
              We use the collected information for the following purposes:
            </p>
            <ul>
                <li><strong>Providing and Improving the Service:</strong> The primary use of your information (email, location inputs, etc.) is to operate the MeetMeHalfway Service and provide you with functionality. For example, we use the addresses you input to calculate midpoint suggestions and routes. We use your account email to log you in and associate your data (like saved places) with your account. Usage data and analytics help us debug issues, understand usage patterns, and improve the user experience (for instance, by optimizing frequently used features or simplifying confusing workflows).</li>
                <li><strong>Account Management and Communication:</strong> We use your email to communicate with you about your account. This can include sending verification emails when you register or change your password, important account notices, receipts for subscription payments, and updates about important changes to the Service or policies. If you contact us for support, we will use your email and possibly other info to respond to you. We may also send you informational or promotional emails about new features or offerings <strong>if</strong> you have opted to receive such communications. You can opt out of non-essential emails at any time (see "Your Rights and Choices" below).</li>
                <li><strong>Subscription and Billing:</strong> If you are a subscriber, we use your information to manage payments and subscriptions. For example, we (via Stripe) will use your provided payment info to charge your card at the start of each billing period. We may send you reminders about upcoming renewals, or notifications of payment issues (like an expired card) to ensure continuity of service. We also maintain transaction records for accounting, audit, and tax purposes as required by law.</li>
                <li><strong>Routing and Location Services:</strong> Addresses and coordinates you provide are used to query third-party geocoding and routing APIs (like HERE, LocationIQ, OSRM, OpenRouteService) in real time to generate results. We use the results returned (midpoint coordinates, route geometry, travel time) to display maps and directions to you. We may temporarily cache these results to improve performance (so that if you repeat a search, it is faster), but these caches are typically short-term.</li>
                <li><strong>Analytics and Performance:</strong> We use usage and device data to monitor and analyze trends, usage, and activities. For instance, we track the number of searches per day, the average number of locations entered, and conversion rates from free to paid plans. This information guides our development decisions (e.g., if a feature is rarely used, we might redesign or remove it; if the service is slow on certain devices, we optimize it). We also monitor for errors or crashes to improve stability. Analytics are generally processed in aggregate form (not tied to your identity) except as needed to troubleshoot specific issues.</li>
                <li><strong>Personalization (Limited):</strong> Currently, the free version of the Service does not personalize content heavily—every user gets similar functionality. We might use your saved locations to pre-fill suggestions that are relevant to you (for example, showing your saved "Home" as an option when you go to add a new location). We may also use your past usage to tailor the Service (for example, remembering that you usually drive instead of walk, and defaulting to that mode; or showing your recently used addresses on the home screen for convenience).</li>
                <li><strong>Security and Abuse Prevention:</strong> We use data (especially IP addresses, device info, and usage patterns) to <strong>protect the Service and our users.</strong> For example:
                    <ul>
                        <li>We perform IP-based rate limiting via Upstash Redis to prevent automated spam or excessive usage that could degrade service for others. Your IP and request timestamps are used to identify and block potential abusive behavior (like someone scripting rapid requests).</li>
                        <li>We may use log and analytics data to detect anomalies that could indicate fraud or security issues. If we notice, for instance, a single account being accessed from opposite sides of the world in a short time, we might flag or investigate that to prevent unauthorized access.</li>
                        <li>We keep audit logs of key account events (like login attempts, password changes) to assist in investigating any security incidents.</li>
                    </ul>
                </li>
                <li><strong>Legal Compliance and Enforcement:</strong> We may use your information to comply with applicable laws, regulations, legal processes, or governmental requests. For instance, maintaining transaction records for tax purposes, or responding to a valid subpoena. We also use and retain data as necessary to enforce our Terms of Service, to resolve disputes, or to investigate fraud or safety concerns. If you violate our Terms (e.g., use the Service for illicit purposes), information like logs may be used to take action and may be provided to law enforcement if appropriate.</li>
                <li><strong>Future Features and Services:</strong> Should we introduce new features (such as a social component, or an ad-supported tier), we may use existing collected information in new ways consistent with this Privacy Policy. For example, if we add a feature to suggest events at the midpoint, we might use your general location to show relevant local events. If these new uses are materially different or require additional data collection, we will update this Privacy Policy and notify you as needed.</li>
            </ul>
            <p>
              We will not use your personal information for purposes incompatible with those above without obtaining your consent or unless required by law. We do not engage in automated decision-making or profiling that produces legal effects or similarly significant effects on you, except for the limited practices mentioned (like automated blocking of abusive usage which is for security).
            </p>

            <h2><strong>How We Share Your Information</strong></h2>
            <p>
              We value your privacy and only share personal information in limited situations, primarily to operate the Service and as required by law. The types of third parties and scenarios in which we share data are:
            </p>
            <h3><strong>1. Service Providers and Partners</strong></h3>
            <p>
              We use trusted third-party companies to help run MeetMeHalfway. These providers <strong>process data on our behalf</strong> for specific functions. We only share the information necessary for them to perform their services, and they are contractually obligated to protect it and use it only for those purposes. Our key service providers include:
            </p>
            <ul>
              <li><strong>Clerk (Authentication Provider):</strong> Clerk manages user registration, login, and account authentication for us. When you sign up or log in, your credentials (email and password, or OAuth tokens if using Google/Apple login) are processed and stored by Clerk. Clerk thereby has access to your email and any profile info related to authentication. They help us securely handle sign-in sessions and password resets. Clerk is bound to keep this information secure and not use it for any other purposes.</li>
              <li><strong>Stripe (Payment Processor):</strong> If you subscribe to a paid plan, your payment details are transmitted directly to Stripe. Stripe processes your payments and stores your payment information (such as credit card number, billing address) on our behalf. We (MeetMeHalfway) do not see or store your full credit card number or financial account data; we receive transaction confirmations and basic info needed for receipts. Stripe may also handle recurring billing. We share with Stripe the minimum information needed (like your email or user ID to link the payment to your account, and the amount to charge). Stripe is PCI-DSS compliant and has its own stringent privacy and security practices.</li>
              <li><strong>Mapping and Geocoding APIs (HERE, LocationIQ):</strong> When you enter an address or place to search, we send that query to third-party geocoding services like HERE or LocationIQ to get coordinates and place information. This means these services will see the location queries (e.g., "123 Main Street, Springfield") and possibly an anonymized identifier or key tied to our account with them. They return data like coordinates or suggested addresses. These services may log queries for usage tracking and billing to us, but they do not receive your personal account information (they don't know the query came from you specifically, just from our Service). However, if you input personally identifiable info as part of a location (for example, naming a saved place "John's House"), that string could be sent to the geocoding API. We advise against using full personal names in labels for this reason.</li>
              <li><strong>Routing Services (OSRM, OpenRouteService):</strong> Similarly, when computing a route or midpoint, we send coordinates (latitude/longitude) to OSRM or OpenRouteService servers. They compute the route and send back directions, distances, and times. They will see location coordinates and the type of request (e.g., driving vs walking). These services might collect usage statistics (for example, number of requests, possibly IP for throttling). We do not provide them your identity – requests are made server-to-server or via your client with our API key. They are simply processing map data to return a result. Both OSRM and OpenRouteService are typically hosted either by us or by the provider under usage limits.</li>
              <li><strong>Analytics (PostHog):</strong> We use PostHog to collect analytics data. PostHog operates on our behalf to gather events (like "User clicked X button" or "Search performed with 4 locations"). The data shared with PostHog includes pseudonymous user identifiers, event data, and device information. PostHog may also capture your IP address and user agent automatically when sending events (though we have configured IP addresses to be partially masked or dropped, if possible, to protect anonymity). PostHog does not use this data for any purpose other than providing analytics services to us. We host our PostHog instance in the cloud, and it is accessible only to our team for analysis.</li>
              <li><strong>Upstash (Redis for Rate Limiting):</strong> For rate limiting and caching, we use Upstash which is a cloud database. We store ephemeral data such as hashed IP addresses and counters in Upstash. This helps us track how many requests come from an IP in a given time. The data in Upstash is minimal (e.g., a key for your IP with a count, which expires after a short window). Upstash as a provider technically has the data in its cloud storage, but they do not access it except to maintain the service. They have no knowledge of whose IP it is or any other context.</li>
              <li><strong>Email and Notification Services:</strong> If we send emails (for account verification, password reset, newsletters, etc.), we may use an email service provider or SMTP service to deliver those emails. This means your email address and the content of the email (like a verification code or newsletter content) will pass through that provider. We will choose reputable providers (e.g., SendGrid, Mailgun, or similar) who are GDPR- and privacy-compliant. They are not permitted to use your email for other purposes. (We will update this policy with specifics if and when we integrate such a service.)</li>
            </ul>
            <p>
              In all cases, we strive to minimize the personal data shared and to anonymize or pseudonymize data where feasible. We also ensure each provider has a privacy policy and standards that align with ours.
            </p>
            <h3><strong>2. Third-Party Ad Partners (None Currently)</strong></h3>
            <p>
              As of the last updated date of this Policy, <strong>we do not share your personal information with any third-party advertisers or ad networks</strong>, because we do not serve third-party ads in the current version of MeetMeHalfway. If you are using the Service now, your data is not being given to ad networks for behavioral advertising purposes.
            </p>
            <p>
              However, we anticipate possibly introducing an ad-supported free tier in the future. If we do so, we plan to implement it in a privacy-conscious way (see the "Future Advertising and Under-18 Users" section below for more detail). We would update this Privacy Policy accordingly at that time and disclose any new data sharing with advertising partners _before_ it begins.
            </p>
            <h3><strong>3. Legal Compliance and Protection</strong></h3>
            <p>
              We may disclose your information if required to do so by law or in the good-faith belief that such action is necessary to:
            </p>
            <ul>
              <li><strong>Comply with legal obligations:</strong> This includes responding to lawful requests by public authorities (e.g., subpoenas, court orders, or legal process). If, for example, a court issues a subpoena for certain account data, we might be compelled to comply after verifying the request's legitimacy.</li>
              <li><strong>Protect and defend rights:</strong> We may share information if necessary to enforce our Terms of Service or other agreements, or to investigate potential violations thereof. Similarly, if a user is engaged in illegal activities or poses a security threat, we might share data with law enforcement or relevant authorities.</li>
              <li><strong>Prevent harm:</strong> We reserve the right to disclose information we believe is appropriate to investigate or prevent actual or suspected illegal activities, fraud, or situations involving potential threats to the safety of any person. For instance, if we suspect someone is using the Service to plan a harmful act, we might alert law enforcement.</li>
              <li><strong>Address security or technical issues:</strong> If a significant cybersecurity threat or data breach occurs, we might share relevant information with security researchers, other companies, or law enforcement to help mitigate or resolve the issue.</li>
            </ul>
            <p>
              In all such cases, we will only share the information that is reasonably necessary for the purpose and will follow applicable legal procedures. Whenever permitted, we will attempt to notify affected users of a legal demand for their data (e.g., via the email on file) unless legally prohibited from doing so (for instance, some government orders come with a gag order).
            </p>
            <h3><strong>4. Business Transfers</strong></h3>
            <p>
              If MeetMeHalfway (the business or substantially all of its assets) is involved in a merger, acquisition, financing, reorganization, bankruptcy, or sale of assets, your information may be transferred as part of that transaction. For example, if another company acquires MeetMeHalfway, your data would likely be one of the assets transferred to that company so that service can continue. In such events, we will ensure the new owner is bound by terms that are at least as protective of your privacy as the terms of this Policy. We will also provide notice to you before your personal data becomes subject to a different privacy policy (the successor company's policy), at which point you would have the opportunity to discontinue use of the Service or request deletion of your data if you desire.
            </p>
            <h3><strong>5. Aggregated or De-Identified Data</strong></h3>
            <p>
              We may also share information that has been aggregated or de-identified in such a way that it cannot reasonably be used to identify you. For example, we might publish blog posts or reports that show usage trends ("e.g., 20% of MeetMeHalfway users frequently meet for coffee vs 15% for restaurants") or average distances traveled. These reports will not contain any personal information. Similarly, we might share aggregate statistics with partners or the public (like total number of users, growth rates, or popular regions) in a way that does not identify individuals.
            </p>
            <p>
              <strong>No Selling of Personal Data:</strong> We want to clarify that <strong>we do not sell your personal information</strong> to third parties for their own commercial uses. "Selling" in this context means sharing personal data in exchange for money or other valuable consideration, for the third party's independent use. We do not do this. All sharing of data is strictly for providing our own Service or as otherwise outlined above (legal, etc.). In the future, if we ever consider monetizing data in ways that could be considered a "sale" (for example, sharing with advertisers or data brokers, which we have no plans to do), we would update our practices to comply with laws like CCPA/CPRA and provide opt-out mechanisms as required.
            </p>

            <h2><strong>Cookies and Tracking Technologies</strong></h2>
            <p>
              MeetMeHalfway uses cookies and similar technologies as part of our Service. Here we explain how and why we use them:
            </p>
            <ul>
              <li><strong>Essential Cookies:</strong> These cookies are necessary for the Service to function. For example, when you log in, we set an authentication cookie (or token in local storage) so that you remain logged in as you navigate. Without it, you would have to log in on every page. These essential cookies might be provided by Clerk (for session management) or by our own server.</li>
              <li><strong>Preference Cookies:</strong> We use cookies or local storage to remember your preferences and settings. For instance, if you dismiss a one-time tutorial or set your preferred travel mode, we may store that in local storage so that the next time you use the app, it remembers your choices. Another example: if we support a dark mode or unit (miles/km) preference, we may save that so the interface remains consistent for you.</li>
              <li><strong>Analytics Cookies:</strong> Our analytics tool (PostHog) uses a cookie or similar mechanism to assign a random unique ID to your browser. This helps us count unique visitors and track how often specific features are used. The analytics cookie does not identify you by name or email; it's just a number that helps differentiate users for statistical purposes. We may also use cookies to track conversion events (like if you upgrade from free to paid, so we know that feature is effective).</li>
              <li><strong>Third-Party Tracking:</strong> At present, we do not use any third-party advertising or social media trackers on our site. That means we do not load Facebook pixels, Google Ads tags, or similar marketing trackers that follow you across sites. All tracking cookies in use are primarily for our own analytics or functionality. If in the future we introduce ads or integrate with a social login, we will update this section to disclose any such third-party cookies.</li>
              <li><strong>Upstash (Rate Limit):</strong> While not a cookie, we note that for rate limiting, your IP and requests are tracked server-side in our Upstash database. This is a server-side mechanism and does not place a cookie on your device; it's transparent to you except in the case that you exceed limits (in which case you might get a temporary block).</li>
              <li><strong>Do Not Track Signals:</strong> Web browsers offer a "Do Not Track" (DNT) setting that you can enable to signal that you do not wish to be tracked across websites. Currently, our Service does not respond differently to browsers with DNT enabled, because we do not engage in cross-site tracking of users for advertising or other purposes. We treat all users equally and only use cookies as described above. If we add any tracking that could be affected by DNT, we will revisit this stance.</li>
            </ul>
            <p>
              <strong>Your Choices for Cookies:</strong> Most web browsers allow you to control cookies through their settings preferences. You can set your browser to refuse certain cookies or to alert you when cookies are being sent. However, if you disable or delete cookies, our Service may not function properly. For example, you might not be able to stay logged in, or certain features may not remember your preferences.
            </p>
            <p>
              On our side, where feasible, we will provide options in the app settings to clear your local storage or log out (which clears session cookies). We may also provide an in-app cookie consent banner or settings if required by law in certain jurisdictions (like the EU). Since our use of cookies is currently minimal and essential, we rely on implied consent when you use the Service (except where law dictates otherwise), but we aim to be transparent about what's in use.
            </p>

            <h2><strong>Data Retention</strong></h2>
            <p>
              <strong>Active Account Data:</strong> We retain your personal information for as long as your account is active or as needed to provide you with the Service. This means that, for example, your saved locations, account email, and usage history are kept in our databases while you continue to use MeetMeHalfway so that we can offer you the Service effectively.
            </p>
            <p>
              If you choose to delete your account, we will initiate deletion of your personal data from our live databases. MeetMeHalfway supports _cascade deletion_, meaning when you delete your account, we attempt to delete all data tied to that account across our systems (this includes your profile info, saved places, and any usage logs associated specifically with your user ID). There may be some latency in complete removal from all systems, but we aim to do this promptly.
            </p>
            <p>
              <strong>Refund and Transaction Records:</strong> If you made payments, we may need to retain certain transaction information (such as receipts, refund records, or basic subscription ledger) even after account deletion, for legitimate business purposes like accounting, audits, and compliance with finance laws. However, this information will generally not include more personal data than necessary (often just an internal user ID, date, and amount). We will also retain any communications or consents required by law (for instance, if you opted out of something and we need to prove that preference).
            </p>
            <p>
              <strong>Analytics Data:</strong> We may retain aggregated analytics data (which is not personally identifiable) indefinitely for historical analysis. Individual-level analytics event data is typically retained for a shorter period (perhaps 1-2 years) before being aggregated or deleted, but we might keep it longer if needed for research on usage patterns. If you delete your account, we will disassociate your user identifier from analytics data to the extent possible (for example, removing or randomizing any user IDs in event logs), though some log entries (with IP addresses or generic IDs) might persist in backups or archives as described below.
            </p>
            <p>
              <strong>Backups and Archives:</strong> Our systems perform routine backups to ensure reliability. Backup copies of databases might contain your personal information even after it is removed from the live database, due to the way backups work. However, these backups are retained only for a limited time and are securely stored. We have retention schedules for backups (for example, weekly snapshots kept for a few months) after which they are deleted or overwritten. We do not access backed-up personal data except if needed for disaster recovery. In the event of a restoration from backup, we will re-delete any accounts or data that had previously been deleted, to the best of our ability.
            </p>
            <p>
              <strong>Inactive Accounts:</strong> If you stop using your account but do not delete it, we will generally keep your data unless/until you request deletion. We currently do not have an "automatic purge" policy for long-inactive accounts, but we might implement one in the future (for example, deleting accounts that have not been accessed in 2+ years) to minimize data retention. If so, we would announce it and likely reach out to inactive users before deletion. Until then, your data remains unless removed by you or required to be removed by law.
            </p>
            <p>
              <strong>Legal Requirements:</strong> We might retain certain information for longer periods if required by applicable law. For instance, some jurisdictions require maintaining records of financial transactions for a number of years for tax or regulatory reasons. Also, if there's an ongoing legal issue (like a dispute or investigation), we might retain relevant information until it is resolved.
            </p>
            <p>
              In summary, we try not to keep personal data longer than necessary for the purposes described in this policy. When personal data is no longer needed, we aim to delete it or anonymize it so you can no longer be identified.
            </p>

            <h2><strong>Data Security</strong></h2>
            <p>
              We take the security of your personal information seriously and implement a variety of measures to safeguard it:
            </p>
            <ul>
                <li><strong>Encryption in Transit:</strong> All communications between your browser/app and MeetMeHalfway servers are protected by encryption protocols such as HTTPS/TLS. This means that data like your login credentials, addresses you input, and route results are encrypted while moving over the internet, preventing eavesdropping.</li>
                <li><strong>Encryption at Rest:</strong> Our databases and storage utilize encryption at rest where possible. For instance, if we use managed database services or cloud storage, those systems encrypt the data on disk. Additionally, particularly sensitive data (like passwords) are further protected: passwords are hashed (using algorithms like bcrypt or argon2) via Clerk, meaning we never store your actual password, only a secure hash. Payment information is not stored on our servers; Stripe handles that and they store it securely.</li>
                <li><strong>Access Controls:</strong> Only authorized personnel (in this case, since MeetMeHalfway is a small operation, that might just be the owner and perhaps a limited set of developers or admins) have access to personal data, and even then, only what is necessary for their role. For example, our support team (if one exists beyond the owner) may access your account email and subscription status to assist you, but they would not have direct access to your password or payment card details. We use authentication and audit logging on our administrative access to monitor any access to sensitive data.</li>
                <li><strong>Testing and Best Practices:</strong> We keep our software dependencies up to date to patch security vulnerabilities. We also follow secure coding practices, and when we integrate third-party libraries or APIs, we review their security stance. The Service is regularly monitored for suspicious activities, and we employ firewalls and other network security measures to protect against unauthorized access.</li>
                <li><strong>Rate Limiting and Throttling:</strong> To mitigate brute force attacks or scraping, we use rate limiting (via Upstash, as mentioned). This can help block malicious actors who try to overwhelm our system or guess login credentials.</li>
                <li><strong>Third-Party Security:</strong> We choose reputable third-party processors (Clerk, Stripe, etc.) known for their strong security practices and compliance certifications. For example, Stripe is PCI compliant for payment security, and Clerk likely follows best practices for identity management. We review their documentation to ensure they meet our standards.</li>
                <li><strong>Data Minimization:</strong> We collect only what we need. By not collecting overly sensitive data, we reduce risk. For instance, we do not collect government IDs, we do not collect plain text passwords, and we do not store your precise ongoing location or movements.</li>
                <li><strong>Incident Response:</strong> Despite all measures, no system can be 100% secure. We have a plan in place for responding to security incidents. If we suspect or become aware of a data breach affecting your personal info, we will notify affected users and the appropriate authorities as required by law, and take steps to mitigate the damage.</li>
            </ul>
            <p>
              <strong>User Responsibilities:</strong> You also play a role in keeping your data secure. We encourage you to use a strong, unique password for MeetMeHalfway and to keep your account credentials confidential. Do not share your password with others. If you suspect unauthorized access to your account, please change your password immediately and contact us. Also, be mindful when entering addresses or sharing content; avoid putting sensitive personal details in free-form fields like labels.
            </p>
            <p>
              While we strive to protect your information, by using our Service, you acknowledge that no method of transmission over the Internet or electronic storage is completely secure. Therefore, we cannot guarantee absolute security. However, we will continue to update and improve our security practices as new threats and technologies emerge.
            </p>

            <h2><strong>Your Rights and Choices</strong></h2>
            <p>
              You have certain rights and choices regarding the personal data we have about you. These include:
            </p>
            <ul>
                <li><strong>Access and Portability:</strong> You have the right to request a copy of the personal information we hold about you, and to obtain it in a commonly used, machine-readable format. For example, you can request an export of your account data (such as the list of saved locations or your search history). We will provide this data to you electronically, after verifying your identity, within a reasonable timeframe.</li>
                <li><strong>Correction (Rectification):</strong> If any personal information we have about you is inaccurate or incomplete, you have the right to request that we correct or update it. For instance, if you change email addresses or notice that a saved label is wrong, you can update it yourself in the app or ask for assistance via support. We encourage you to keep your account information current.</li>
                <li><strong>Deletion (Right to Erasure):</strong> You have the right to request deletion of your personal data. You can achieve this by using the account deletion function in the app (if available) or by contacting us at <strong>support@meetmehalfway.co</strong> with a request to delete your data. Upon such request (and provided we do not have a legal obligation to keep the data), we will delete or anonymize your personal information from our active systems. As noted in "Data Retention", residual copies may remain in backups for a time, but will be purged in accordance with our backup retention schedule. If you request deletion, your account will be closed as part of that process.</li>
                <li><strong>Withdrawal of Consent:</strong> In cases where we rely on your consent to process data (for example, if we ever ask for consent for a newsletter or for precise location use), you have the right to withdraw that consent at any time. This will not affect the lawfulness of processing based on consent before its withdrawal. For instance, if you opt in to a beta feature that collects extra data, you can opt out later and we will stop collecting that data.</li>
                <li><strong>Objection to Processing:</strong> You may have the right to object to certain processing activities. For example, if we were processing your data for direct marketing (which we currently don't do besides optional updates), you can object to that and opt out. If you believe we are processing any data in a way that you do not agree with, you can contact us to discuss or object, especially in jurisdictions like the EU where this is a legal right under GDPR.</li>
                <li><strong>Restrict Processing:</strong> You might have the right to request that we restrict processing of your data in certain cases – for example, if you contest the accuracy of data or have a pending objection, you can ask us to hold the data but not process it further until resolved.</li>
                <li><strong>Opt-Out of Marketing Communications:</strong> If you are receiving promotional or newsletter emails from us, you can unsubscribe at any time by clicking the "unsubscribe" link in those emails or by adjusting your email preferences in your account settings (if available). Transactional emails (like password resets or billing receipts) cannot be fully opted out of, as they are necessary for service, but we keep those to a minimum.</li>
                <li><strong>Opt-Out of Personalized Ads:</strong> _(Applicable if/when we introduce ads.)_ In the event that we start showing personalized advertisements, we will provide a clear mechanism for all users to opt out of personalized (behavioral) advertising. This may include a "Do Not Sell or Share My Personal Information" link or similar, in compliance with laws like the California Consumer Privacy Act (CCPA) as amended by CPRA . Because we currently do not have ads, this is not yet implemented, but we are committed to honoring such preferences. Additionally, for users under 18, we plan to default to non-personalized ads (see Ad Policy below), and for adults, any targeted advertising will come with the ability to opt out.</li>
                <li><strong>California Privacy Rights:</strong> If you are a California resident, in addition to the rights above, you have the right to request a notice describing the categories of personal information we have shared with third parties for their direct marketing purposes, and to know that we do not share information in that way (we do not provide personal data to third parties for their own direct marketing). The CCPA also gives California residents the right to not be discriminated against for exercising their privacy rights. MeetMeHalfway will not deny you service, charge you a different price, or provide a different level of quality of service just because you exercised any of your rights under CCPA. For any formal requests under CCPA/CPRA (access, deletion, etc.), you can contact us via email. We will verify your identity (usually by confirming information about your account usage) before releasing data or deleting data. If you have an authorized agent making the request on your behalf, we will require proof of authorization.</li>
                <li><strong>GDPR (EU/EEA) Rights:</strong> If you are in the European Union or European Economic Area (though our Service is not specifically targeted there, but you may still use it), you have rights under the General Data Protection Regulation. These include all the ones listed above (access, rectification, deletion, objection, restriction, portability, and the right not to be subject to automated decision-making). You also have the right to lodge a complaint with a Data Protection Authority (DPA) in your country if you believe we have violated your data protection rights. Our base of operations is in the U.S., so our lead supervisory authority (if needed) might not directly apply, but we will do our best to cooperate with any international data inquiries. If you need to transfer personal data from the EU to our servers in the US, we rely on your consent (using the service is a form of consent) or other recognized legal bases (such as contractual necessity, since we can't provide the service otherwise). We ensure that any transfers are done with appropriate safeguards (for example, our third-party providers like Stripe and Clerk may be certified under EU-U.S. data frameworks or use standard contractual clauses).</li>
                <li><strong>Data Portability:</strong> We mentioned access to data above; portability goes a step further in allowing you to request your data in a format that you can take to another service (when applicable). For MeetMeHalfway, if you requested, we could provide something like a CSV or JSON file of your saved locations, for example, which you could theoretically use elsewhere. We will accommodate such requests to the extent feasible.</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at <strong>support@meetmehalfway.co</strong> with your request. We may need to verify your identity (to make sure it's really you making the request). This could involve verifying ownership of the email associated with your account or asking for certain usage details that only you would know.
            </p>
            <p>
              We will respond to requests within a reasonable timeframe, and within any timeframe required by law. For example, under CCPA, we generally have 45 days to respond to access or deletion requests (with possible extension), but we aim to be faster.
            </p>
            <p>
              Please note that some rights have limitations. For example, if you request deletion, we might not delete absolutely all data if we are legally required to keep some (as explained in Data Retention). If you request access, we will provide the personal data, but not anything that includes others' data or our confidential information.
            </p>
            <p>
              Finally, if you have any questions or need help understanding how to exercise your rights, feel free to reach out and we'll gladly guide you.
            </p>

            <h2><strong>Children's Privacy</strong></h2>
            <p>
              Protecting the privacy of young users is especially important to us. MeetMeHalfway is <strong>not intended for children under the age of 13</strong>, and we do not knowingly collect personal information from children under 13 years old. Our policy regarding minors is as follows:
            </p>
            <ul>
                <li><strong>Under 13:</strong> If you are under 13, <strong>please do not use MeetMeHalfway or provide any information about yourself to us.</strong> This includes not creating an account, not entering your email, and not using our services in general. We do not knowingly allow children under 13 to register or use the Service. In compliance with the U.S. Children's Online Privacy Protection Act (COPPA) and similar laws, if we discover that we have collected personal data from a child under 13 without verifiable parental consent, we will delete that information promptly. If you believe we might have any information from or about a child under 13, please contact us immediately at support@meetmehalfway.co so that we can take appropriate action.</li>
                <li><strong>Ages 13–17:</strong> Teenagers (13 to 17 years old) are allowed to use the Service, but <strong>only with the involvement and consent of a parent or guardian</strong>. We strongly encourage parents/guardians to educate their teens about online safety and to monitor their use of online services. If you are between 13 and 17, you should review this Privacy Policy and our Terms of Service with your parent or guardian to make sure you both understand it. While we do not require parental consent for users 13+ (since that is outside COPPA's scope), by using the Service as a minor you are confirming that you have your parent/guardian's permission.</li>
                <li><strong>Limited Data Practices for Teens:</strong> We do not differentiate accounts by age in our current system (we do not ask for a birthdate upon sign-up). However, we are aware that some users might be minors, and we design our practices to be generally kid/teen-friendly:
                    <ul>
                        <li>We do not serve targeted ads (and if we add an ad-supported tier, we will ensure that users under 18 see only contextual/non-personalized ads, as described in our Advertising Policy Note).</li>
                        <li>We do not knowingly collect more personal information from teens than we do from adults. The same info (email, locations, etc.) is collected for providing the service.</li>
                        <li>We avoid any content within the Service that is inappropriate for under-18 users. The purpose of the app (finding places to meet) is generally appropriate for all ages above 13, but we expect most of our users to be drivers (16+). There is no mature content in the app itself.</li>
                    </ul>
                </li>
                <li><strong>Parental Rights:</strong> If you are a parent or guardian and you discover that your child under 18 is using our Service without your consent, or if you have concerns about the personal information of your child that may be in our system, please contact us. For users under 18, parents/guardians may exercise rights on their behalf (such as requesting access or deletion of the minor's data). We may require verification that you are indeed the parent or guardian.</li>
                <li><strong>COPPA Compliance:</strong> We adhere to COPPA. We do not knowingly contact or solicit personal information from children under 13. In the unlikely event that we wish to make a portion of our Service available to children under 13 in the future (for example, a version for family use), we would implement COPPA-compliant practices, such as obtaining verifiable parental consent before collection of personal data from children, and providing the ability for parents to review and delete their children's information. But again, our Service is currently not directed at this age group at all.</li>
                <li><strong>California Minors (Privacy Rights):</strong> If you are a California resident under 18 and a registered user of our Service, California Business & Professions Code § 22581 may allow you to request removal of content or information you have publicly posted. However, currently, MeetMeHalfway does not have public posting features (like forums or profiles visible to others) — your inputs are private. In any case, you can contact us to request deletion of any personal content you believe is publicly posted, and we will honor it if applicable.</li>
            </ul>
            <p>
              We emphasize: <strong>No user under 13 should use MeetMeHalfway.</strong> If we find an account that appears to be used by someone under 13, we will suspend the account and attempt to verify age or get parental consent. For users 13-17, we treat your data nearly the same as adults' data in terms of privacy (with the protective measures mentioned, like no targeted ads). We are always open to feedback from parents and young users on how to improve our policies.
            </p>

            <h2><strong>Future Advertising and Under-18 Users</strong></h2>
            <p>
              While MeetMeHalfway currently does not display ads, we are considering a future <strong>ad-supported free tier</strong>. We are committed to doing this in a way that respects user privacy, especially for users who are minors. Here's what we plan and commit to, with regard to advertising and young users:
            </p>
            <ul>
                <li><strong>Contextual Ads Only for Minors:</strong> If we introduce advertising, any users identified as under 18 will <strong>only be shown contextual ads</strong>. Contextual ads are ads that are based on the context of what you are doing in the app (for example, an ad for a local café might be shown when you search for coffee shops at a midpoint) rather than based on a profile of your personal data or behavior. We will not build behavioral advertising profiles on users under 18. This means no tracking of a teen's activity across different websites or over time for ad targeting purposes. Ads for minors would be generic or context-based, not personalized.</li>
                <li><strong>No Selling Data of Minors:</strong> We will not sell or share personal information of users we know are under 18 with advertisers or data brokers. Under laws like CPRA in California, selling/sharing the data of consumers under 16 is prohibited unless an opt-in is obtained . We plan to go further and simply not engage in any such practice for all under-18 users. If an ad partner must have any data (for example, to verify or cap views on an ad), we will ensure it is data that cannot be used to identify or track the minor (such as context or non-unique device info), and that the partner agrees not to use it for other purposes.</li>
                <li><strong>Parental Controls:</strong> If feasible, we will offer controls or settings for parents of teen users. For example, a parent might link to a teen's account (if such a feature is implemented) and be able to opt the teen out of ads entirely or review the kind of ads being shown. This is an exploration area, and we will update our policy if such features are introduced.</li>
                <li><strong>Ad Content Appropriateness:</strong> We will work with ad networks or providers that support filtering out inappropriate or sensitive ad content for minors. We will avoid categories of ads that are not suitable for those under 18 (such as alcohol, gambling, adult content, or other age-restricted products). Our aim is that any ads shown in the free tier are family-friendly and relevant to the app's use (e.g., travel, food, attractions).</li>
                <li><strong>Opt-Out for Personalized Ads (All Users):</strong> For adult users (18+), if we implement personalized ads using their data, we will provide a clear ability to opt out of such personalization. This will likely be via a "Privacy Settings" menu or a "Do Not Sell/Share My Info" link on our site, in line with CCPA/CPRA requirements. Once opted out, that user would only see contextual ads, similar to minors, or possibly fewer ads overall. We will also honor global privacy signals like the <strong>Global Privacy Control (GPC)</strong> if detected, which is a browser setting that indicates a user's desire to opt out of data sale/sharing. Furthermore, by default, we may choose to treat all users (not just minors) as opted-out of personalized ads unless they explicitly opt in. This conservative approach ensures compliance and builds trust.</li>
                <li><strong>Limited Data for Ads:</strong> In any case, we will minimize data used for advertising purposes. For example, rather than providing an ad network with your exact location or entire browsing history, we might only provide the general area of the midpoint you're looking at (so they can serve a relevant local business ad) and perhaps basic device info for formatting (e.g., "show a mobile-friendly ad"). We will not provide your name, email, saved addresses, or any contact info to advertisers without explicit consent.</li>
                <li><strong>Transparency:</strong> If and when ads are launched, we will update this Privacy Policy and likely publish a dedicated <strong>Advertising Policy</strong> (as a separate document or section) detailing how ads work, what data is or isn't used, and how users can control their experience. We want users, especially parents of teens, to be fully informed about how advertising is implemented. (This document itself serves as a note of that future policy.)</li>
                <li><strong>COPPA and Ads:</strong> Although we don't allow under-13 users, we will design the ad system such that if any under-13 somehow were to slip through or if COPPA is expanded in the future, we are not collecting or using personal data in a way that violates children's privacy rules. Essentially, our approach is to treat all minors' data with the sensitivity required for children's data.</li>
                <li><strong>Advertising Partners:</strong> We will vet any advertising networks or partners for their compliance with laws and their reputation on privacy. We'll favor partners that offer strong privacy controls, do not themselves build invasive profiles, and that support serving non-personalized ads. If we cannot find a suitable partner, we may delay or modify the ad-supported model.</li>
            </ul>
            <p>
              In summary, <strong>our promise is that introducing ads will not come at the expense of user privacy, especially for young users.</strong> We view contextual, non-tracking ads as the future for any minors on the platform. And for adults, the choice to not be tracked will be easy and respected.
            </p>
            <p>
              We welcome feedback from our community on this approach, and we'll refine these plans as needed to ensure compliance and user trust. Please refer to our separate "Advertising Policy (Under-18 Users)" document for more details on this topic.
            </p>

            <h2><strong>Changes to This Privacy Policy</strong></h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. When we make changes, we will update the "Last Updated" date at the top of the policy document. If changes are significant, we will provide a more prominent notice (such as by email to registered users or by placing a notice on our website or in the app).
            </p>
            <p>
              Examples of significant changes might include: adding new categories of personal information we collect, changes to how we share data, or launching new features that impact privacy (like introducing advertising or social features).
            </p>
            <p>
              We encourage you to review this Policy periodically to stay informed about how we are protecting the personal information we collect. Your continued use of the Service after any changes to this Privacy Policy constitutes your acceptance of the updated policy. If you do not agree with any updates or changes, you should stop using the Service and may request deletion of your data as outlined above.
            </p>
            <p>
              For historical reference, we will maintain an archive or changelog of past privacy policies upon request, so you can see what changed.
            </p>

            <h2><strong>Contact Information</strong></h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or the personal data we hold about you, please contact us:
            </p>
            <ul>
                <li><strong>Email:</strong> support@meetmehalfway.co</li>
                <li><strong>Mailing Address:</strong> MeetMeHalfway – Privacy Inquiries, 305 Princeton Ave, Hamilton, NJ 08619, USA</li>
            </ul>
            <p>
              We will do our best to respond promptly to your inquiry. Your privacy and trust are important to us, and we welcome your feedback.
            </p>

            <hr />

            <h1><strong>Advertising Policy (Ad-Supported Free Tier & Under-18 Users)</strong></h1>
            <p>
              <em>This Advertising Policy Note outlines our planned approach to advertising on MeetMeHalfway, particularly with regard to users under 18. (Effective Date: This policy will take effect if and when MeetMeHalfway introduces advertising into the Service. Currently, as of June 2025, we do not serve ads. We are providing this information proactively.)</em>
            </p>

            <h2><strong>Introduction</strong></h2>
            <p>
              Our goal is to maintain a positive, safe, and lawful experience for all users, including teenagers, when we introduce ads. We recognize that advertising can raise privacy concerns, and that special rules apply when minors are involved. We are committed to:
            </p>
            <ul>
                <li><strong>Transparency:</strong> Clearly informing users about what data (if any) is used for ads, and what types of ads they will see.</li>
                <li><strong>Consent and Control:</strong> Giving users (or their parents, in the case of minors) control over personalized advertising, including easy opt-out options.</li>
                <li><strong>Safety and Appropriateness:</strong> Ensuring ad content is appropriate for a general audience and avoiding ads that are unsuitable for teens.</li>
                <li><strong>Compliance:</strong> Adhering to laws and regulations such as COPPA (for children under 13), and state laws like California's privacy laws (CCPA/CPRA) which have provisions for minors under 16.</li>
            </ul>
            <p>
              By preparing this policy in advance, we aim to integrate advertising in a thoughtful manner when the time comes. Users of the free tier will be able to enjoy the Service with ads, knowing that their data is handled carefully, and users who prefer to avoid ads can choose a paid subscription or opt out of personalization as described below.
            </p>

            <h2><strong>Ad Content and Targeting Practices</strong></h2>
            <p>
              <strong>What types of ads will be shown?</strong> We plan to serve primarily <strong>contextual ads</strong> on MeetMeHalfway. Contextual ads are advertisements that are relevant to the content or context of what the user is doing, rather than who the user is. For example, if two users are searching for a midpoint to meet for coffee, a contextual ad might show a promotion for a coffee shop or a cafe chain, because it's relevant to the context (looking for coffee). If someone is looking at a route, an ad might be for a gas station or a restaurant along the way.
            </p>
            <p>
              Key points about our ad targeting approach:
            </p>
            <ul>
                <li><strong>No Behavioral Profiles:</strong> We will not build marketing profiles based on a user's browsing history across different websites or apps. We will not track users across the web for ad targeting. We limit ad targeting to the MeetMeHalfway context only.</li>
                <li><strong>Limited In-App Personalization:</strong> Within our app, we might use _non-identifying_ aspects of your usage to choose ads. For example, the general region of a search (to show local businesses), or the category of place you search for (to show similar services). But we will not use sensitive personal data for targeting (such as your saved addresses labeled "Home/Work" or any personal attributes like your email or name).</li>
                <li><strong>Relevant and Non-Intrusive:</strong> Ads will be placed in a way that they do not overwhelm the user experience. Perhaps a banner ad on a results page or a sponsored suggestion among search results, clearly labeled as such. We will not use obnoxious formats (like pop-ups that block navigation or ads that auto-play sound).</li>
            </ul>
            <h2><strong>Special Protections for Users Under 18</strong></h2>
            <p>
              <strong>Contextual Ads Only:</strong> Users who are under 18 years old will only see contextual ads, never personalized ads based on behavioral tracking. This means ads will be based on the immediate context of what they are doing in the app (e.g., searching for restaurants might show a restaurant ad), but not on their personal data or past behavior.
            </p>
            <p>
              <strong>No Data Sharing:</strong> We will not share personal information of users under 18 with advertising partners. Any data needed for ad delivery (such as general location context) will be anonymized and limited to what is necessary for contextual relevance.
            </p>
            <p>
              <strong>Age-Appropriate Content:</strong> All ads shown to users under 18 will be filtered to exclude age-inappropriate content such as alcohol, gambling, adult content, or other products/services restricted to adults.
            </p>
            <p>
              <strong>Parental Rights:</strong> Parents or guardians of users under 18 may contact us to request information about ads shown to their child or to opt their child out of ads entirely (which may require upgrading to a paid plan).
            </p>

            <h2><strong>User Controls and Opt-Out Options</strong></h2>
            <p>
              <strong>Opt-Out of Personalized Ads:</strong> All users (18+) will have the ability to opt out of any personalized advertising. This can be done through account settings or a "Do Not Sell/Share My Personal Information" link as required by privacy laws like CCPA/CPRA.
            </p>
            <p>
              <strong>Ad-Free Experience:</strong> Users who prefer not to see ads can subscribe to a paid plan that removes advertising entirely.
            </p>
            <p>
              <strong>Global Privacy Control:</strong> We will honor Global Privacy Control (GPC) signals from browsers, which automatically opt users out of data sharing for advertising purposes.
            </p>

            <h2><strong>Advertising Partners and Data Sharing</strong></h2>
            <p>
              When we introduce advertising, we will work only with reputable advertising partners who:
            </p>
            <ul>
              <li>Comply with privacy laws and industry standards</li>
              <li>Support contextual advertising options</li>
              <li>Provide appropriate content filtering for different age groups</li>
              <li>Offer strong user privacy controls</li>
            </ul>
            <p>
              We will update this policy with specific partner information when advertising is implemented.
            </p>

            <h2><strong>Compliance and Legal Requirements</strong></h2>
            <p>
              Our advertising practices will comply with:
            </p>
            <ul>
              <li><strong>COPPA:</strong> No advertising to users under 13 (who are not permitted to use the service)</li>
              <li><strong>CCPA/CPRA:</strong> No sale or sharing of personal information of users under 16 without opt-in consent</li>
              <li><strong>FTC Guidelines:</strong> Clear disclosure of sponsored content and advertising</li>
              <li><strong>State and Federal Laws:</strong> All applicable advertising and privacy regulations</li>
            </ul>

            <h2><strong>Updates to Advertising Policy</strong></h2>
            <p>
              This advertising policy will be updated when we launch advertising features. We will provide advance notice to users about the introduction of ads and any changes to this policy. Users will have the opportunity to review the updated terms before ads are implemented.
            </p>

            <h2><strong>Contact for Advertising Concerns</strong></h2>
            <p>
              If you have questions or concerns about our advertising practices, especially regarding users under 18, please contact us at:
            </p>
            <ul>
              <li><strong>Email:</strong> support@meetmehalfway.co</li>
              <li><strong>Subject Line:</strong> "Advertising Policy Inquiry"</li>
            </ul>
            <p>
              We are committed to maintaining user trust and privacy as we evolve our service offerings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}