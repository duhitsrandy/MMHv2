export default function TermsOfServicePage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Terms of Service
          </h1>
          
          <div className="mt-8 prose prose-lg prose-gray dark:prose-invert max-w-none">
            <p className="italic">Last Updated: June 10, 2025</p>
  
            <h2><strong>Acceptance of Terms</strong></h2>
            <p>
              By creating an account or using the MeetMeHalfway service (the “Service”), you agree to these Terms of Service (“Terms”) and our Privacy Policy. These Terms form a binding legal agreement between you and <strong>MeetMeHalfway</strong> (a sole proprietorship owned by Randy Rhubart). If you do not agree with these Terms or the Privacy Policy, you must not use the Service. We reserve the right to update these Terms at any time as described in the “Changes to Terms” section below.
            </p>
          
            <h2><strong>Eligibility</strong></h2>
            <ul>
              <li><strong>Age Requirement:</strong> You must be at least 13 years old to use the Service. The Service is <strong>not intended for children under 13</strong>, and we do not knowingly allow such users. If you are under 13, do not use MeetMeHalfway.</li>
              <li><strong>Teens 13–17:</strong> If you are between 13 and 17 years old, you affirm that you have permission from a parent or guardian to use the Service. We recommend that minors use the Service under adult supervision. Certain features (such as future ad-supported features) may be restricted or adjusted for users under 18 for safety and compliance reasons.</li>
              <li><strong>Ability to Contract:</strong> By using the Service, you represent that you are legally capable of entering into this agreement (e.g. not barred from contracting by law). If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these Terms.</li>
            </ul>
          
            <h2><strong>Accounts and Registration</strong></h2>
            <p>
              To access most features beyond the basic free tier, you must create an account. Account registration is handled through our authentication provider, <strong>Clerk</strong>. When creating an account, you agree to provide accurate, current information (including a valid email address) and to keep it updated. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. <strong>You may not share your account</strong> with others or use another user’s account without permission. Notify us immediately at <strong>support@meetmehalfway.co</strong> of any unauthorized use or security breach.
            </p>
          
            <h2><strong>Subscription and Payments</strong></h2>
            <p>
              MeetMeHalfway offers both a free tier and paid subscription tiers with additional features. Payment processing for subscriptions is handled by <strong>Stripe</strong>. By subscribing, you agree to the following terms:
            </p>
            <ul>
              <li><strong>Auto-Renewal:</strong> Paid subscriptions auto-renew on a recurring basis (e.g. monthly or annually, as specified) until canceled. Your payment method on file will be charged automatically through Stripe at the start of each billing cycle.</li>
              <li><strong>7-Day Refund Policy:</strong> We offer a 7-day refund window for subscription purchases. If you are unsatisfied within 7 days of a subscription charge (whether it’s your initial purchase or a renewal), you may request a refund by contacting us at <strong>support@meetmehalfway.co</strong>. We will refund the subscription fee, no questions asked, if the request is made within 7 calendar days of the charge.</li>
              <li><strong>Cancellation:</strong> You may cancel your subscription at any time. Cancellation will prevent future charges and take effect at the <strong>end</strong> of your current billing period. You will continue to have access to premium features until the current paid term expires. To cancel, use the account settings in the Service or contact support for assistance. No further payments will be taken after cancellation (aside from any prorated charges explicitly agreed to, if applicable).</li>
              <li><strong>Payment Information:</strong> All payment details (such as credit card numbers and billing information) are handled by Stripe. We do not store your full payment card details on our servers. By subscribing, you agree to Stripe’s terms and policies regarding payments. You are responsible for providing a valid payment method and updating it as needed to avoid interruption of service.</li>
              <li><strong>Changes to Fees:</strong> Our subscription prices and available plans may change over time. If we adjust pricing or introduce new charges, we will provide advance notice (for example, via email or in-app notification) at least 30 days before the change. If you do not agree to a pricing change, you may cancel your subscription before the new rates take effect. Continued use of the Service after price changes constitute acceptance of the new rates.</li>
              <li><strong>Taxes:</strong> Subscription fees are exclusive of any applicable taxes or duties, unless otherwise stated. You are responsible for any sales, use, VAT, or similar taxes imposed by applicable law.</li>
            </ul>
          
            <h2><strong>Acceptable Use and Safety</strong></h2>
            <p>
              MeetMeHalfway is designed to help you find midpoint meeting locations and related routing information. We expect users to use the Service responsibly and safely:
            </p>
            <ul>
              <li><strong>Personal Use Only:</strong> The Service is provided for your personal, non-commercial use to plan meetups and trips. You agree not to resell, redistribute, or exploit the Service or the results of the Service for commercial purposes without our permission.</li>
              <li><strong>No Distracted Driving:</strong> <strong>Do NOT use the Service while driving or in any situation that requires your full attention.</strong> It is strictly prohibited to interact with the app when you are operating a vehicle or engaged in any activity where use of the Service could distract you and create a safety hazard. Only input addresses or check routes <strong>when you are parked in a safe location</strong> or not in control of a moving vehicle. Alternatively, have a passenger operate the app if needed. You are solely responsible for following all traffic laws and maintaining safety; MeetMeHalfway is not liable for accidents or violations resulting from improper use of the app.</li>
              <li><strong>No Illegal or Harmful Use:</strong> You agree not to use MeetMeHalfway to engage in any unlawful, harmful, or abusive activities. This includes (but is not limited to) refraining from:</li>
              <ul>
                <li>Using the Service to stalk, harass, or harm any individual.</li>
                <li>Inputting any information that you have no right to share or that is false or misleading (e.g. addresses you are not authorized to use).</li>
                <li>Attempting to probe, scan, or test the vulnerability of our systems or to breach security or authentication measures.</li>
                <li>Using the Service to transmit any viruses, malware, or other harmful code.</li>
              </ul>
              <li><strong>Meeting Others and Real-World Caution:</strong> If you use MeetMeHalfway to arrange real-world meetups (for example, meeting a friend or acquaintance at a suggested midpoint location), you do so at your own risk. <strong>Always exercise common sense and caution when meeting someone or visiting a new location.</strong> We recommend meeting in public, well-lit places and telling someone you trust about your plans. MeetMeHalfway only provides suggestions for locations; we do not vet or endorse any meeting venue or other users of the Service. You are solely responsible for your personal safety and decisions when meeting others. <strong>We disclaim any liability for incidents or harms that occur during or as a result of meetings arranged using our Service.</strong></li>
              <li><strong>Third-Party POI Information:</strong> The Service may display or suggest points of interest (such as restaurants, gas stations, parks, etc.) near the calculated midpoint. This information may come from third-party sources (like mapping APIs or databases). We do not guarantee the quality, safety, or suitability of any third-party location or business. Always independently verify that a suggested location meets your needs (for example, check recent reviews or confirm it is open) before relying on it. MeetMeHalfway is not affiliated with or responsible for third-party locations, and inclusion of a place in our suggestions is not an endorsement.</li>
            </ul>
            <p>
              Violating the above acceptable use rules may result in suspension or termination of your access (see “Termination” below). We reserve the right to take appropriate action, including legal action where appropriate, against users who violate these Terms or misuse the Service.
            </p>
          
            <h2><strong>Third-Party Services and Content</strong></h2>
            <p>
              MeetMeHalfway integrates several third-party services to function. By using the Service, you acknowledge and agree that your information may be transmitted to or processed by these third parties, as outlined in our Privacy Policy, and that the functionality or data they provide is subject to their own terms and conditions:
            </p>
            <ul>
              <li><strong>Authentication (Clerk):</strong> We use Clerk to manage user sign-ups and logins. When you register or log in, your credentials and account data are processed by Clerk. You agree to abide by any acceptable use policies of the authentication system.</li>
              <li><strong>Payment Processing (Stripe):</strong> We use Stripe to handle subscription payments and billing. Any financial transactions you make via MeetMeHalfway are governed by Stripe’s terms of service. We are not responsible for errors or breaches that occur on Stripe’s systems. However, we will support you in resolving any billing issues to the best of our ability.</li>
              <li><strong>Mapping and Geocoding (HERE, LocationIQ):</strong> The Service uses third-party mapping and geocoding providers (such as HERE and LocationIQ) to convert addresses to coordinates and to find nearby places. When you search for a location or midpoint, the address data and location queries may be forwarded to these providers to provide results. These providers may have their own usage terms and data practices. We have implemented required attribution for map data (for example, <strong>OpenStreetMap</strong> data © OpenStreetMap contributors) within the app.</li>
              <li><strong>Routing Engines (OSRM, OpenRouteService):</strong> MeetMeHalfway relies on <strong>open-source routing services</strong> including the Open Source Routing Machine (OSRM) and OpenRouteService to calculate routes, distances, and travel times between points. When you request a route or directions, coordinates and route parameters are sent to these services. They return route information which we display to you. These services come with no guarantee of accuracy or availability, and their terms of service and licenses apply to their usage. We pass through required attributions for these services in the app as needed.</li>
              <li><strong>Analytics (PostHog):</strong> We use PostHog for analytics to understand how users interact with our Service (e.g., which features are most used). PostHog may use cookies or similar means to collect usage data. This helps us improve the Service. No personal travel addresses or meeting content are made public; analytics are primarily aggregate usage statistics. Details are provided in our Privacy Policy.</li>
              <li><strong>Rate Limiting (Upstash Redis):</strong> To protect the Service from abuse (such as excessive automated requests), we use Upstash (a cloud Redis database) to store IP addresses and request counts for a short period. This helps us enforce fair usage limits. This is a background technical measure and not typically visible to users, but we disclose it for transparency.</li>
            </ul>
            <p>
              Any content provided by these third parties or any other users (for example, map data, geocoding results, or suggested venues) remains the responsibility of the party that provided it. We do not guarantee and are not liable for third-party content, and your use of such content may be subject to the third party’s terms.
            </p>
            <p>
              <strong>Third-Party Terms:</strong> You agree to comply with any relevant third-party terms of service or license agreements when those services are accessed through our app (for example, you will not attempt to extract large amounts of mapping data in violation of mapping providers’ policies, etc.). If any third-party service requires us to include additional terms or disclaimers in our Terms, those are hereby incorporated by reference. (For instance, use of HERE mapping data is subject to HERE’s end-user terms, and use of OpenRouteService is subject to its terms and license.)
            </p>
          
            <h2><strong>Routing, Location Data, and Accuracy</strong></h2>
            <p>
              MeetMeHalfway’s core function is to calculate halfway points and suggest routes and locations. While we strive to provide useful and reasonably accurate information, <strong>the Service relies on mathematical calculations and third-party data, which may not always be accurate or up-to-date.</strong> Accordingly:
            </p>
            <ul>
              <li><strong>No Guaranteed Accuracy:</strong> All information provided by MeetMeHalfway (including but not limited to suggested midpoint locations, recommended routes, travel distance/time estimates, and points of interest) is provided on an “as is” basis for planning convenience. The data may contain errors, omissions, or inaccuracies. <strong>We do not guarantee that any route or location suggestion is correct, complete, or safe.</strong> Factors like road closures, traffic conditions, construction, or map inaccuracies can affect the results. You should use your own judgment and double-check critical information (for example, verify the meeting location address and check traffic or weather conditions on your route).</li>
              <li><strong>Not for Emergency or Critical Use:</strong> You should not use MeetMeHalfway as your sole source of navigation information for time-sensitive or critical purposes. For example, do not rely on it for emergency services, life-or-death travel plans, or any situation where inaccurate directions could cause harm. Always have an alternative plan or official sources of information if you are undertaking a crucial journey.</li>
              <li><strong>User Input:</strong> The quality of results depends on the addresses or locations you enter. You are responsible for entering accurate starting locations. MeetMeHalfway is not liable if an incorrect or misspelled address leads to a flawed midpoint or route.</li>
              <li><strong>Travel Time Estimates:</strong> Any travel time estimates are approximate and assume typical conditions. Actual travel times may vary due to traffic, weather, or other delays. Always give yourself extra time when meeting someone, beyond what the app suggests.</li>
              <li><strong>No Endorsement of Routes:</strong> A suggested route is not a guarantee that the route is the best or safest. Road hazards or safety conditions are not accounted for by the algorithm. Always follow traffic signs and your own judgment over the app’s suggestions. If a suggested route seems to include private property, unsafe areas, or illegal shortcuts, do not follow it.</li>
            </ul>
            <p>
              By using the Service, you agree that you understand these limitations and will exercise common sense. <strong>MeetMeHalfway disclaims any and all liability for the accuracy, reliability, or completeness of the mapping and routing data provided.</strong> You use the results at your own risk.
            </p>
          
            <h2><strong>Disclaimer of Warranties</strong></h2>
            <p>
              <strong>MeetMeHalfway is provided “AS IS” and “AS AVAILABLE” without any warranty of any kind.</strong> To the fullest extent permitted by law, we disclaim all warranties, express or implied, regarding the Service and its content, including but not limited to implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement.
            </p>
            <p>
              In particular, we do not guarantee that:
            </p>
            <ul>
              <li>The Service will be uninterrupted, error-free, or secure at all times.</li>
              <li>Any results (including meeting locations, routes, or recommendations) will meet your expectations or requirements.</li>
              <li>Any defects or errors will be corrected, or that the Service will be free of viruses or other harmful components.</li>
              <li>The data and information obtained through the Service will be accurate, up-to-date, or reliable.</li>
            </ul>
            <p>
              All information or advice (such as route suggestions or meeting recommendations) provided by the Service is for informational purposes only. It is not professional advice (e.g., not legal, financial, or medical advice), and you should not rely on it as such. <strong>You assume full responsibility for your use of the Service.</strong> If you are dissatisfied with any part of the Service, your sole remedy is to stop using it (and cancel any paid subscriptions as applicable).
            </p>
            <p>
              Some jurisdictions do not allow the exclusion of certain warranties, so some of the above disclaimers may not apply to you. In such cases, any warranties required by law are limited in duration to 30 days from first use of the Service.
            </p>
          
            <h2><strong>Limitation of Liability</strong></h2>
            <p>
              To the maximum extent permitted by law, <strong>MeetMeHalfway (and its owner, Randy Rhubart) will not be liable for any indirect, incidental, special, consequential, or exemplary damages</strong> arising out of or in connection with your use of (or inability to use) the Service. This includes, without limitation, damages for personal injuries, accidents, emotional distress, lost profits, lost data, business interruption, or cost of substitute services, even if we have been advised of the possibility of such damages.
            </p>
            <p>
              In particular, and <strong>without limiting the generality of the above</strong>, MeetMeHalfway and its owner are <strong>not liable</strong> for:
            </p>
            <ul>
              <li><strong>Accidents or Personal Harm:</strong> Any injuries, harm, or accidents you suffer (or that you cause to others) while traveling to a suggested meeting location or during a meeting arranged through the Service. For example, we are not liable if you get into a vehicle collision on the way to meet someone, or if an incident occurs during the meetup itself.</li>
              <li><strong>Meeting Outcomes:</strong> Any outcomes of you meeting with other individuals via a location found on our Service. We do not screen or verify the people you meet or the places you go. <strong>You assume all risk</strong> associated with meeting others (whether they are people you know or strangers) and visiting new locations. We strongly encourage safety precautions, but ultimately we cannot be responsible for others’ actions or the conditions of venues.</li>
              <li><strong>Data Errors or Loss:</strong> Losses or damages resulting from errors or omissions in the data (such as incorrect directions or addresses) or any service unavailability. This includes situations like getting lost due to wrong directions or any cost incurred from extra travel.</li>
              <li><strong>Third-Party Services:</strong> Any issues caused by third-party services we integrate with (Clerk, Stripe, HERE, LocationIQ, OSRM, OpenRouteService, PostHog, Upstash, etc.). For example, we are not responsible for financial losses due to payment processing errors by Stripe, or privacy breaches on a third-party platform. While we choose reputable providers and strive to secure your data, use of those services is largely beyond our control.</li>
              <li><strong>User Conduct:</strong> Damages arising from the conduct of other users of the Service or any third parties. If another user behaves inappropriately or unlawfully (for instance, if someone you meet through the app harms you or if a user enters offensive data into the app), we are not liable for their actions. However, we encourage you to report any abuse to us so we can take appropriate action.</li>
            </ul>
            <p>
              If, notwithstanding the above exclusions, liability is imposed on MeetMeHalfway for any cause or matter, then <strong>in no event will our total liability to you exceed the amount you have paid us in subscription fees in the past six (6) months</strong> (or, if greater, fifty U.S. dollars ($50)). Since some jurisdictions do not allow the exclusion or limitation of certain damages, portions of this section may not apply to you. In such jurisdictions, our liability is limited to the fullest extent permitted by law.
            </p>
            <p>
              You agree that the limitations of liability and disclaimers in these Terms are a fair allocation of risk and form an essential basis of the bargain between you and us. Without these limitations, the pricing of our service (including the availability of a free tier) would be significantly different.
            </p>
          
            <h2><strong>Indemnification</strong></h2>
            <p>
              You agree to <strong>indemnify, defend, and hold harmless</strong> MeetMeHalfway, its owner (Randy Rhubart), and any affiliates, contractors, employees, and agents from and against any and all claims, liabilities, damages, losses, and expenses (including reasonable attorneys’ fees) that arise from or relate to:
            </p>
            <ul>
              <li>Your use or misuse of the Service;</li>
              <li>Your violation of any of these Terms;</li>
              <li>Your violation of any applicable law or regulation (for example, traffic laws while using the Service);</li>
              <li>Your infringement of any rights of any other person or entity (for example, if you input data you have no right to use, or if you misuse third-party content).</li>
            </ul>
            <p>
              We reserve the right to assume the exclusive defense and control of any matter otherwise subject to indemnification by you (at your expense), and you agree to cooperate with our defense of such claims. You may not settle any such claim without our prior written consent.
            </p>
          
            <h2><strong>Termination</strong></h2>
            <p>
              <strong>Termination by You:</strong> You may stop using the Service at any time. You may also delete your account at any time through the account settings or by contacting support. Deleting your account will terminate your right to access logged-in features of the Service. Our Privacy Policy explains what happens to your data upon account deletion (we offer <strong>cascade deletion</strong>, meaning we will delete your personal data when you delete your account, subject to legal obligations to retain certain data).
            </p>
            <p>
              <strong>Termination or Suspension by Us:</strong> We reserve the right to suspend or terminate your access to the Service (or any part of it) at our sole discretion, with or without notice, if we believe you have violated these Terms or pose a risk to the Service or other users. We may also terminate the Service or any user’s access for convenience (for any reason or no reason) by providing notice to the email associated with the account. If your account is terminated due to a breach of these Terms or unlawful conduct, you will not be entitled to any refunds for subscriptions already paid. If we terminate your account for convenience (and not due to your misconduct), we may provide a pro-rated refund for any remaining full months of prepaid service.
            </p>
            <p>
              After termination (by you or us), the following will occur:
            </p>
            <ul>
              <li>Your right to use the Service will immediately cease.</li>
              <li>We may delete your account credentials and related data from our active databases (though note that residual data may remain in backups for a period as described in our Privacy Policy).</li>
              <li>Any provisions of these Terms which by their nature should survive termination (such as disclaimers of warranty, limitations of liability, indemnity, and governing law) will survive.</li>
            </ul>
            <p>
              If you believe your account was suspended or terminated in error, or if you have questions about an account termination, please contact us at <strong>support@meetmehalfway.co</strong>.
            </p>
          
            <h2><strong>Changes to the Service or Terms</strong></h2>
            <p>
              MeetMeHalfway is constantly evolving. We may, at our discretion, <strong>change, add, or remove features</strong> of the Service at any time. We may also discontinue the Service entirely. We are not liable for any changes in availability of features or any temporary or permanent cessation of the Service.
            </p>
            <p>
              Likewise, we may update these Terms from time to time. If we make material changes, we will notify users by posting the updated Terms on our website and updating the “Last Updated” date at the top. In some cases, we may also send an email or in-app notification to inform you of the change. <strong>It is your responsibility to review these Terms periodically.</strong> Continued use of the Service after updated Terms have been posted constitutes your acceptance of the revised Terms.
            </p>
            <p>
              If you do not agree to a significant change in the Terms or to any specific change that we identify as requiring consent, you should stop using the Service and, if applicable, cancel your subscription. In the event of a material change, if you cancel your paid subscription within 30 days of the change, you may request a pro-rated refund for the remainder of your current billing period (if the change adversely affects you). This refund provision does not apply to changes required by law or minor edits/clarifications that do not negatively impact user rights.
            </p>
          
            <h2><strong>Governing Law</strong></h2>
            <p>
              These Terms of Service and any disputes arising out of or relating to these Terms or the Service will be governed by and construed in accordance with the laws of the <strong>State of New Jersey</strong>, USA, without regard to its conflict of law principles. You agree that any legal action or proceeding between you and MeetMeHalfway arising out of or related to these Terms or the use of the Service shall be brought exclusively in a state or federal court of competent jurisdiction located in New Jersey, and you consent to the personal jurisdiction of and venue in such courts.
            </p>
            <p>
              If you are accessing the Service from outside the United States, you do so on your own initiative and are responsible for compliance with local laws. Note that we do not currently restrict access by geography, but the Service is operated from the United States and our infrastructure is primarily located in the U.S.
            </p>
            <p>
              <strong>International Use:</strong> We make no representation that the Service is appropriate or available in all locations. Using the Service is prohibited in any jurisdiction where the Service or any content may violate local law. You agree not to use the Service in any such jurisdiction.
            </p>
          
            <h2><strong>Contact Information</strong></h2>
            <p>
              If you have any questions, concerns, or feedback about these Terms or the Service, you can contact us:
            </p>
            <ul>
              <li><strong>Email:</strong> support@meetmehalfway.co</li>
            </ul>
            <p>
              We will do our best to respond promptly. Communications relating specifically to this Terms of Service should include the subject line “Terms of Service Inquiry” for clarity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}