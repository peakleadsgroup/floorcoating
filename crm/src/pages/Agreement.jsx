import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Agreement.css'

// Color options from landingpage.html
const COLOR_OPTIONS = [
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Basil.jpg.jpg?raw=true', name: 'Basil' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Blue-jay.jpg.jpg?raw=true', name: 'Blue Jay' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Cabin-Fever.jpg.jpg?raw=true', name: 'Cabin Fever' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Cardinal.jpg.jpg?raw=true', name: 'Cardinal' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Cinnamon.jpg.jpg?raw=true', name: 'Cinnamon' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Coffee-Bean.jpg.jpg?raw=true', name: 'Coffee Bean' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Cyberspace.jpg.jpg?raw=true', name: 'Cyberspace' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Domino.jpg.jpg?raw=true', name: 'Domino' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Driftwood.jpg.jpg?raw=true', name: 'Driftwood' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Fortress.jpg.jpg?raw=true', name: 'Fortress' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Fog.jpg.jpg?raw=true', name: 'Fog' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Hog.jpg.jpg?raw=true', name: 'Hog' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Latte.jpg.jpg?raw=true', name: 'Latte' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Madras.jpg.jpg?raw=true', name: 'Madras' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Nutmeg.jpg.jpg?raw=true', name: 'Nutmeg' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Olive-Grove.jpg.jpg?raw=true', name: 'Olive Grove' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Pebble-Beach.jpg.jpg?raw=true', name: 'Pebble Beach' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Pecan.jpg.jpg?raw=true', name: 'Pecan' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/River-Rock.jpg.jpg?raw=true', name: 'River Rock' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Sandstone.jpg.jpg?raw=true', name: 'Sandstone' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Sea-Serpants.jpg.jpg?raw=true', name: 'Sea Serpents' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Slatestone.jpg.jpg?raw=true', name: 'Slatestone' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Smoke.jpg.jpg?raw=true', name: 'Smoke' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Twilight.jpg-1.webp?raw=true', name: 'Twilight' }
]

export default function Agreement() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const leadId = searchParams.get('leadId')
  
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedColor, setSelectedColor] = useState('')
  const [signature, setSignature] = useState('')
  const [signatureName, setSignatureName] = useState('')
  const [isSigning, setIsSigning] = useState(false)
  const [canvasRef, setCanvasRef] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastX, setLastX] = useState(0)
  const [lastY, setLastY] = useState(0)
  const [savingStatus, setSavingStatus] = useState('')

  useEffect(() => {
    if (!leadId) {
      setError('No lead ID provided')
      setLoading(false)
      return
    }
    fetchLead()
  }, [leadId])

  useEffect(() => {
    if (canvasRef) {
      const ctx = canvasRef.getContext('2d')
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      
      // Load saved signature from localStorage if available
      if (leadId) {
        const savedSignature = localStorage.getItem(`signature_${leadId}`)
        if (savedSignature) {
          const img = new Image()
          img.onload = () => {
            ctx.clearRect(0, 0, canvasRef.width, canvasRef.height)
            ctx.drawImage(img, 0, 0)
            setSignature(savedSignature)
          }
          img.src = savedSignature
        }
      }
    }
  }, [canvasRef, leadId])

  function generateContractContent(leadData, colorChoice) {
    return `
RESINOUS AND CEMENTITIOUS FLOORING CONTRACT

This Agreement is entered into on ${new Date().toLocaleDateString()} between PEAK FLOOR COATING and ${leadData.first_name} ${leadData.last_name}.

PROJECT DETAILS:
Customer: ${leadData.first_name} ${leadData.last_name}
Address: ${leadData.street_address || 'N/A'}, ${leadData.city || 'N/A'}, ${leadData.state || 'N/A'} ${leadData.zip || 'N/A'}
Square Footage: ${leadData.square_footage || leadData.estimated_sqft || 'N/A'} sq ft
Total Price: $${leadData.total_price ? parseFloat(leadData.total_price).toFixed(2) : '0.00'}
Color Choice: ${colorChoice || 'Not selected'}

1) ESTIMATE / SITE VISIT

PEAK FLOOR COATING conducts site surveys for every job. During the visit, an PEAK FLOOR COATING representative will test the moisture on the intended floor, test the hardness, and evaluate the site conditions. This is a required visit payable, unless prior arrangements are made with PEAK FLOOR COATING, at the time of service on all projects and shall be deducted from the final bill once the contract is complete. Prepayment is required for the site visit. Any estimate given by an PEAK FLOOR COATING representative is valid for 30 days. PEAK FLOOR COATING reserves the right to revise any and all estimates after 30 days due to the volatility in the current market.

2) MATERIAL, COLOR SELECTION, & SAMPLES

The CUSTOMER agrees that colors for solid color resins, chip colors, metallic colors, and stains/dyes must be chosen before the project is scheduled and at least 2 weeks before the proposed start date of the project. If samples are made, you must approve the sample before the job can be started. Samples shall be created upon request. Each handmade sample is $500. The CUSTOMER agrees that all resinous coating products and decorative concrete products are special order and shall be treated as such. PEAK FLOOR COATING is certified to install all the materials it takes to create your resinous and/or decorative concrete flooring project and shall provide certifications upon request.

3) UNDERSTANDING THE CHARACTERISTICS OF RESINOUS COATINGS

The CUSTOMER understands that resinous coatings are liquid applied floors that cure by a chemical reaction. Certain characteristics can occur with this process, such as "Fisheye's", "Comets", or minor deviations in color batching and the finish. The CUSTOMER understands that PEAK FLOOR COATING can duplicate the colors and can manipulate the flow of the resins to a certain extent, however, cannot guarantee the same movement of pigments showcased in any picture or on any sample board.

The CUSTOMER understands that resinous coatings attract dust particles, air impurities, small insects/bugs and curious animals. Damage from these environmental factors could impair the finish or become embedded in the application.

The CUSTOMER understands that resinous coatings are highly reflective and can reflect environmental colors, which will produce slight color differences to the human eye. Environmental lighting can also cause hue differences based on the type of light emitted from the CUSTOMERS lighting system.

4) UNDERSTANDING THE CHARACTERISTICS OF TOPCOATS

The CUSTOMER waves all rights to yellowing or ambering if an epoxy topcoat, whether it be water based or solvent based, is chosen for the proposed flooring system. Epoxy contains styrene, which will amber naturally and is intensified under U.V. light. PEAK FLOOR COATING doesn't recommend epoxy as a clear coat.

The CUSTOMER understands that topcoats can exhibit a slight 'orange peel' effect, roller marks could be slightly visible, and environmental impurities can affect the final finish. PEAK FLOOR COATING uses the best industry standards to minimize these effects.

The CUSTOMER understands that water-based products, although intended for residential use, can have some odor.

The CUSTOMER understands that most topcoats are UV resistant, however yellowing or ambering of an epoxy floor can occur with over exposure to UV light.

The CUSTOMER understands that solvent-based products emit a strong odor and require pilot lights in appliances to be shut off during the resinous flooring system installation. PEAK FLOOR COATING shall notify the customer before any such solvent-based products are applied. The CUSTOMER agrees that they have, here in, been notified of the flammability of solvent-based products and agrees that shutting down pilot lights is their responsibility and holds PEAK FLOOR COATING not liable for any damages caused by a solvent's flammability.

The CUSTOMER understands that all topcoats are scratch resistant, except any type of wax coating, which has very little scratch resistance. PEAK FLOOR COATING uses the best available products based on the CUSTOMERS intended use to mitigate any scratching. However, the CUSTOMER understands that PEAK FLOOR COATING shall not warranty any scratching or demarcations from misuse or abuse.

5) UNDERSTANDING THE CHARACTERISTICS OF DECORATIVE CONCRETE APPLICATIONS

In Regard to Stains and Dye Applications:

The CUSTOMER agrees that PEAK FLOOR COATING makes no guarantee, express or implied, as to the uniformity of these color applications in relation to the reaction and/or coloring of substrates through the use/application of acid stains, dyes, and water stains, etc. when they are applied to the existing substrate. The CUSTOMER agrees that the condition of the substrate, it's profile, and overall condition, as well as if slabs were poured/finished at different times, can be unknown and could cause color differences throughout the substrate during these applications. Also, if the substrate has nail holes or chips requiring filling/repair, in addition to adhesive and/or previous sealer residues that remain in or on the concrete (whether detectible or invisible), as well as other types of marks and/or foreign matter, will affect the end/finished appearance of the interior or exterior surface to an indeterminable degree during the use/application of acid stains, dyes, and water stains, etc. PEAK FLOOR COATING cannot be held liable and makes no guarantees as to the uniformity and finish of these systems. It is the sole responsibility of the CUSTOMER to ensure that the concrete substrates, which are to serve as the finished floors or exterior surfaces, are adequately protected from contamination and/or damage from other contractors/trades. Should such contamination, marks/gouges/marring/stains of the substrate occur due to failure to guard against, all costs associated with the removal, repair, or correction of them shall be the sole responsibility of the CUSTOMER. It is also understood that stains from petroleum and such chemicals that are spilled onto the surface may leave permanent marks or stains. Additionally, tape shall never be applied directly to the decorative concrete surface. The CUSTOMER understands that tapes contain plasticizers that can fuse to the surface, causing potential defects and delamination, which may leave permanent marks. PEAK FLOOR COATING recommends onsite mock-ups for use/application of acid stains, dyes, and water stains, etc., which would need to be applied to the existing substrate. The CUSTOMER is responsible for the cost of the mock-up applications and shall be payable upfront when the mock-ups are requested.

In Regard to Exterior Coatings:

The CUSTOMER agrees that PEAK FLOOR COATING makes no guarantee, express or implied, that an outdoor coating will be unharmed from the likes of snowplows, general construction equipment, sharp tools, shovels, snow blowers, tire chains, petroleum chemicals, acts of God, your neighbor, the mailman, delivery drivers, etc. and cannot be held liable for any expenses caused by such activities or equipment use.

The CUSTOMER agrees to shut off any sprinkler system for a minimum of 2 days before any exterior coating, at the time of installation, and for a period of 5 days after the installation, in order to allow proper cure time.

The CUSTOMER understands that outdoor coatings require a certain environment for successful application. PEAK FLOOR COATING follows material datasheets to determine when environmental conditions are conducive to application. The CUSTOMER also understands that schedules shall be changed, and deadlines may be missed due to these environmental conditions. The CUSTOMER agrees that PEAK FLOOR COATING makes no guarantee of finishing dates on any outside projects and holds PEAK FLOOR COATING not liable for any costs, material or intangible, associated with environmental delays.

6) SCOPE OF WORK

PEAK FLOOR COATING shall provide all labor and materials and perform all work necessary for the completion of the CUSTOMERS specified floor system according to the contract and industry standards. Any drawings and specifications signed by both CUSTOMER and an PEAK FLOOR COATING representative are hereby made a part of this contract.

PEAK FLOOR COATING shall properly dispose of all containers, masking paper, etc., as well as maintain a clean and orderly working environment; however, we shall not be responsible for those of other contractors that may also be working on the site.

7) BUILDING CONDITIONS

The CUSTOMER agrees that it is their responsibility to provide a weathertight and cleaned out work area before the start date of the project. It is paramount that the area be weathertight and clean as these are liquid applied floors and contaminants will affect the finished product. The CUSTOMER agrees any additional costs in material and labor, that is needed to complete the job due to flatness, damage, cracks, spalling, and general defects in the original concrete slab or flooring space, shall be the CUSTOMER's responsibility and due at the next progress payment. PEAK FLOOR COATING shall do its due diligence at the time of the estimate in order to best estimate any repairs that are necessary for the installation of the specified flooring system.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for and does not warrant water damage from leaking pipes, receptacles, gutters or faulty seals or barriers such as, but not limited to, doors, windows, walls, etc. in the finished floor. In the case of total failure due to these conditions, PEAK FLOOR COATING shall notify the customer and discuss repair / replacement options and the costs associated with the repair of the damaged area.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for the condition of the original concrete surface if it has been previously covered, so that its condition could not be properly assessed; and the removal of previously installed flooring reveals a more severe condition than previously anticipated; PEAK FLOOR COATING may choose to either renegotiate the Contract with the CUSTOMER or terminate the Contract entirely. In the event that termination becomes necessary, the deposit shall be returned, minus the cost of any special ordered products and labor performed.

8) CHANGE ORDERS

Any system changes, repairs, additions, and subtractions to the original scope of work shall warrant a change order with payment due at the next progress payment. The CUSTOMER shall be notified of any additional repairs and material and a change order will need to be approved before work continues. The CUSTOMER agrees to be available for contact during the project in order to approve or deny such change orders.

9) CUSTOMER RESPONSIBILITY DURING INSTALLATION

The CUSTOMER is responsible for protecting the work area once PEAK FLOOR COATING has concluded work for the day. PEAK FLOOR COATING shall mark areas that need to be avoided during the cure process. If any damage occurs to the floor due to humans, animals, vehicles, trash cans, bikes, etc., and the damage is such that it must be fixed in order to fulfill the original scope of work; the CUSTOMER shall be notified with a change order, and upon approval, those areas shall be fixed and billed accordingly with payment due at the next progress payment.

10) CUSTOMER AVAILABILITY

The CUSTOMER agrees to be present and available during all scheduled workdays so that any questions or concerns can be explained and approved. Work shall halt when a change order or the colors need to be approved by the CUSTOMER, which may be needed to move to the next step in the flooring system installation.

The CUSTOMER understands that in the event of untimely communication, 1 hour or more, by the CUSTOMER, PEAK FLOOR COATING has the right to charge their current hourly labor rate for each crew member during this wait time and if communication doesn't happen within that hour, the crew may leave the jobsite for the day and shall return once communication resumes. Any charges shall be assessed and payable at the next progress payment.

11) MOBILIZATION

A mobilization fee of $1,000 for commercial projects and $500 for residential projects shall be assessed for each trip made to the jobsite and the floor and/or the building is not ready to be installed during the scheduled time frame. If the site isn't ready on the scheduled start day, the mobilization fee shall be due immediately and the project shall be moved to the back of the waiting list, unless PEAK FLOOR COATING is given 2 weeks' notice of any scheduling changes. This fee is waived for acts of nature that interfere with the installation of the flooring system.

12) SCHEDULING, MATERIAL DELAYS, AND AVAILABILITY

If some unfortunate delay affects the completion date, PEAK FLOOR COATING shall notify the CUSTOMER and reschedule accordingly.

The CUSTOMER agrees that weather can't be controlled and that completion dates shall change accordingly. PEAK FLOOR COATING shall call the CUSTOMER to reschedule for when conditions are fit to continue the installation of the contracted flooring system.

PEAK FLOOR COATING shall not be held liable for any costs associated with material delays or scheduling delays caused by the acts of Mother Nature. This includes any events held at the CUSTOMERS project location.

The CUSTOMER agrees to disclose all scheduling conflicts at the time of scheduling the project.

The CUSTOMER understands that timing of completion is weather and location dependent and that their completion date may change as a result of weather delays that may cause time over runs on other projects. PEAK FLOOR COATING shall due its due diligence to contact and update the CUSTOMER.

The CUSTOMER agrees that scheduling delays due to material delays are not grounds for breach of contract.

PEAK FLOOR COATING reserves the right to substitute like for like materials if the quoted materials become unavailable.

PEAK FLOOR COATING reserves the right to start any commercial project on the scheduled date of service, whether the project / building property is ready or not, unless notice is given at least 2 weeks in advance.

The CUSTOMER understands that if access to the area being worked on is limited to sections instead of the total job scope due to other trades and restrictions imposed by the CUSTOMER, a change order shall be submitted and PEAK FLOOR COATING shall be entitled to monetary compensation for the schedule changes, unless prior approval was received and reflected in the original proposal.

13) MARKET VOLATILITY

The CUSTOMER agrees that due to market volatility, the price for added work may be different than the current pricing.

PEAK FLOOR COATING has no control over the market availability of products. If a products availability status goes to backorder, unexpectedly, the CUSTOMER cannot hold PEAK FLOOR COATING liable for any schedule changes and delays, nor any cost associated with such delays.

14) PAYMENT TERMS

The CUSTOMER agrees that payment should be made to PEAK FLOOR COATING using cash, check, or an electronic bank draft (ACH/EFT/Money Wire) in the amount of the contract plus any change orders. Credit cards are accepted with a 4% service fee.

The CUSTOMER agrees that any deposit collected toward the proposed job shall be considered an approval of the contract and shall not be refundable.

PEAK FLOOR COATING requires a 50% deposit of the contract price, 30% when we start the job, and the rest is due upon completion of the services described in this contract for residential projects.

PEAK FLOOR COATING requires a 50% deposit of the contract price and shall bill in progress increments for commercial contracts. Final payment is due Net 30 of the project completion date.

If the CUSTOMERS invoice is not paid when due, a $75 late fee plus compounding interest at a rate of 1.5% interest per week shall be added to the invoice and payable on all overdue invoices.

The CUSTOMER agrees that unpaid and overdue invoices/account balances may be secured by a mechanic's lien on the CUSTOMERS location.

The CUSTOMER agrees that if a payment is returned, there shall be a $75 NSF fee plus any applicable fees or administrative costs for the NSF payment.

The CUSTOMER agrees that in addition to any other right or remedy provided by law, if the CUSTOMER fails to pay for the Services when due, PEAK FLOOR COATING has the option to treat such failure to pay as a material breach of the Contract and may cancel this Contract and / or seek legal remedies including but not limited to filing criminal charges for theft of services, attorney's fees, administrative costs, court costs, etc.

15) PEAK FLOOR COATING IS NOT RESPONSIBLE FOR OR SHALL NOT BE HELD LIABLE FOR:

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for premature entry of persons not respecting posted non-entry designators, such as caution tape, cones, and/or signs, etc.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for paint lift or tape residue resulting from the masking materials used on adjacent surfaces during the flooring system installation. PEAK FLOOR COATING attempts to use the best recommended tape for job purposes. If the CUSTOMER prefers the use of any alternate materials, they must be previously identified and made readily available when the work begins at the customer's expense.

PEAK FLOOR COATING shall not be responsible for dust damage arising as a result of the concrete preparation phase of the floor system installation. PEAK FLOOR COATING, follows all industry standards for silica dust extraction during the grinding / preparation process.

PEAK FLOOR COATING shall not be responsible for damage to the coating during installation and for a period of 7 days after installation of the flooring system from persons, actions, or events which are not directly associated with PEAK FLOOR COATING or their assignees.

PEAK FLOOR COATING shall not be responsible for unknown and/or undisclosed substances contained within, or previously added to the existing project surface which is to be coated.

PEAK FLOOR COATING shall not be responsible for conditions and/or damages arising from the overloading of electrical circuits which may occur during, or as a result of, the accomplishment of any work associated with the fulfillment of this contractual agreement and/or any addendums which may or may not be identified herein. PEAK FLOOR COATING's installation includes the use of a generator on site, unless access to the outside is limited or restricted. At which point power needs shall be discussed with the CUSTOMER and the CUSTOMER shall then be responsible for the 220v power requirement and the cost associated with power consumption.

On new construction work PEAK FLOOR COATING shall not be held responsible for the improper pouring/placing/finish work of the slab by independent concrete contractors that will affect the finished decorative surface that is being applied by PEAK FLOOR COATING. It is the sole responsibility of the general contractor, home builder, or property owner to direct the concrete contractor that the concrete slab is to serve as the interior floor or exterior surface and that the concrete surface is to be the finished surface. Upon request, PEAK FLOOR COATING shall provide a written specification as to the way the concrete is to be finished; however, we shall not oversee the finish work of the concrete contractor nor shall PEAK FLOOR COATING be responsible for the finished surface. If the surface is not finished per written specification provided, it is the sole responsibility of the CUSTOMER as to costs associated with correction thereof.

On remodel construction work PEAK FLOOR COATING shall not be held responsible for the improper pouring/placing/finish work of the existing slab by independent concrete contractors that will affect the finished decorative surface that is being applied by PEAK FLOOR COATING.

The CUSTOMER understands and holds the responsibility of complying with the specifications of the installed system and the maintenance of the installed system. This information shall be provided on a case-by-case basis, and spec sheets for products shall be provided upon request. The CUSTOMER understands that if they are not operating within the set specifications of the installed flooring system, damage may occur, and such damage is not covered by the warranty stated in this contract.

16) CANCELLATION

PEAK FLOOR COATING follows the Illinois Consumer Protection Acts right to cancel certain consumer transactions within three business days. Please send verbal and written intentions of cancellation before the 3 days have passed.

17) INSURANCE

PEAK FLOOR COATING shall maintain general liability, commercial auto, and workers compensation insurance. Insurance certificates are available at the CUSTOMERS' request.

18) WARRANTY

Every interior resinous floor system completed by PEAK FLOOR COATING includes a Limited Lifetime Surface Warranty that covers delamination, peeling, cracking, fading, and yellowing (except for clear "epoxy" applications) as long as the recommended system is installed for the environment that the floor occupies. After the first year, the CUSTOMER is responsible for the labor and PEAK FLOOR COATING shall provide the materials at a depreciated rate for any approved warranty claims on interior floors for the life expectancy of the installed floor.

Every exterior resinous/cementitious floor system completed by PEAK FLOOR COATING includes a 1-Year Surface Warranty that covers delamination, peeling, cracking, and yellowing as long as the recommended system is installed for the environment that the floor occupies. This warranty covers defects in materials, in accordance with the manufacturer's warranty, at the time of installation and a 1-year labor guarantee. After the first year, the CUSTOMER is responsible for the labor and materials for any repairs.

PEAK FLOOR COATING shall provide any additional manufacturer warranties to the CUSTOMER. Any manufacturer warranty that covers this flooring installation, in whole or in part, shall supersede the warranty here in stated. It is the CUSTOMERS responsibility to initiate any contact with the manufacturer and the CUSTOMER shall abide by the manufacturer's recommendations / remedies.

This warranty applies to the original CUSTOMER and is non-transferrable, unless prior arrangements have been made in writing with PEAK FLOOR COATING, and the original Service Recipient. The terms of the Limited Lifetime Surface Warranty for interior floors and 1-Year exterior warranty constitutes the entire warranty understanding of the parties, and no other understanding, warranties, collateral, or otherwise, shall be binding unless in writing and signed by both the original CUSTOMER and PEAK FLOOR COATING.

No oral representations or promises are binding and cannot alter or modify the terms of these warranties.

In the event of non-payment by the CUSTOMER at the time of job completion, this Warranty is null and void.

19) WARRANTY EXCLUSIONS

The CUSTOMER understands that any warranty claims are subject to the following exclusions:

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for and does not warrant damage to or dulling of finish caused by prolonged use or CUSTOMER negligence which includes but is not limited to, heavy use, lack of maintenance & care, harsh chemicals used for cleaning, cleaning with abrasive material and/or detergents, or the improper use of pressure washers and scrubbing/buffing machines.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for and does not warrant damage from outside forces, abuse, neglect, and misuse, for example: scratches, damage from impact, spinning tires, flame, mechanical damage to the underlying concrete, or lack of maintenance & cleaning.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for and does not warrant harsh chemicals such as battery acid, brake fluid, paint stripper, industrial solvents, or like products. If a product, such as ReXPro, is installed, the floor will be warranted against chemical damage according to the products technical data sheet.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for and does not warrant moisture related issues, including intrusion, efflorescence, hydrostatic pressure, and swelling of filled joints.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for and does not warrant defects in the concrete/substrate. This includes, but is not limited to heaving, shifting, popping, settling, moisture issues, geo-movement and/or structural foundation movement.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for and does not warrant defects caused by alterations or modifications performed by persons and/or entities other than PEAK FLOOR COATING.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for and does not warrant any current and/or future substrate cracks, repaired cracks, and any filled floor joints from ghosting through the coated surface or breaking back apart. PEAK FLOOR COATING follows all industry standards in floor repair.

20) WARRANTY CLAIMS

All warranty claims must be submitted by email to: drew@peakfloorcoating.com and include pictures of the damaged area along with an explanation of the circumstances around warranty claim that occurred. PEAK FLOOR COATING shall schedule a site visit to assess the damage and provide a solution in writing within 2 weeks for the CUSTOMER's review. A service call fee shall be collected at the time of scheduling the warranty claim site visit. Pricing shall be in accordance with PEAK FLOOR COATING current service call pricing and will be stated at the time of scheduling. The service fee is not refundable.

If the damage is determined to be the product or workmanship, the CUSTOMER will be given the warranty remedies in writing for the CUSTOMER's review and subsequent resolution.

21) MEDIA AND ADVERTISING USE

The CUSTOMER shall grant PEAK FLOOR COATING permission to use any photograph, video, or other digital media ("photo") taken during the flooring installation in any and all of its print, digital, or social media publications, including web-based publications, without payment or other consideration to the CUSTOMER. PEAK FLOOR COATING shall not use the CUSTOMERS' last name, business name, address, or phone number in association with any such publications, unless express consent is given by the CUSTOMER.

PEAK FLOOR COATING shall not use any such media at the express request of the CUSTOMER. The CUSTOMER agrees to inform PEAK FLOOR COATING in advance, of the scheduled installation, if they want to request that any media not be used in any type of publication.

22) INDEMNIFICATION FOR SLIP AND FALLS

To the extent permissible by law, the CUSTOMER agrees to indemnify, defend and hold harmless PEAK FLOOR COATING against all liabilities, costs, expenses, damages and losses including but not limited to any direct, indirect or consequential losses, loss of profit, loss of reputation and all interest, penalties and legal costs (calculated on a full indemnity basis) and all other professional costs and expenses suffered or incurred by the CUSTOMER arising out of or in connection with slip and fall lawsuits or claims on any flooring installed by PEAK FLOOR COATING.

23) ENTIRE AGREEMENT

This Agreement contains the entire agreement and understanding among the Parties hereto with respect to the subject matter hereof, and supersedes all prior agreements, understandings, inducements, and conditions, express or implied, oral or written, of any nature whatsoever with respect to the subject matter hereof. The express terms hereof control and supersede any course of performance and/or usage of the trade inconsistent with any of the terms hereof.
    `.trim()
  }

  async function fetchLead() {
    try {
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (fetchError) throw fetchError
      if (!data) throw new Error('Lead not found')

      setLead(data)
      setSelectedColor(data.color_choice || '')
      
      // Generate contract text
      const contractContent = generateContractContent(data, data.color_choice || selectedColor)
      setContractText(contractContent)
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching lead:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  async function handleColorSelect(colorName) {
    setSelectedColor(colorName)
    // Auto-save color choice
    if (leadId && lead) {
      try {
        const { error } = await supabase
          .from('leads')
          .update({ color_choice: colorName })
          .eq('id', leadId)
        
        if (error) throw error
        
        // Update contract text with new color
        const updatedContract = generateContractContent(lead, colorName)
        setContractText(updatedContract)
        
        setSavingStatus('Color choice saved')
        setTimeout(() => setSavingStatus(''), 2000)
      } catch (err) {
        console.error('Error saving color choice:', err)
      }
    }
  }

  function handleCanvasMouseDown(e) {
    if (!canvasRef) return
    setIsDrawing(true)
    const rect = canvasRef.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setLastX(x)
    setLastY(y)
    
    const ctx = canvasRef.getContext('2d')
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function handleCanvasMouseMove(e) {
    if (!isDrawing || !canvasRef) return
    const rect = canvasRef.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const ctx = canvasRef.getContext('2d')
    ctx.lineTo(x, y)
    ctx.stroke()
    
    setLastX(x)
    setLastY(y)
    
    // Auto-save signature while drawing (debounced)
    if (canvasRef) {
      const signatureData = canvasRef.toDataURL('image/png')
      setSignature(signatureData)
      // Save to localStorage every stroke
      if (leadId) {
        try {
          localStorage.setItem(`signature_${leadId}`, signatureData)
        } catch (err) {
          console.error('Error saving signature:', err)
        }
      }
    }
  }

  function handleCanvasMouseUp() {
    if (isDrawing && canvasRef) {
      // Auto-save signature on mouse up
      captureSignature()
    }
    setIsDrawing(false)
  }

  function handleCanvasTouchStart(e) {
    e.preventDefault()
    if (!canvasRef) return
    const touch = e.touches[0]
    const rect = canvasRef.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    setLastX(x)
    setLastY(y)
    setIsDrawing(true)
    
    const ctx = canvasRef.getContext('2d')
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function handleCanvasTouchMove(e) {
    e.preventDefault()
    if (!isDrawing || !canvasRef) return
    const touch = e.touches[0]
    const rect = canvasRef.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    
    const ctx = canvasRef.getContext('2d')
    ctx.lineTo(x, y)
    ctx.stroke()
    
    setLastX(x)
    setLastY(y)
    
    // Auto-save signature while drawing (for touch)
    if (canvasRef) {
      const signatureData = canvasRef.toDataURL('image/png')
      setSignature(signatureData)
      // Save to localStorage every stroke
      if (leadId) {
        try {
          localStorage.setItem(`signature_${leadId}`, signatureData)
        } catch (err) {
          console.error('Error saving signature:', err)
        }
      }
    }
  }

  function handleCanvasTouchEnd(e) {
    e.preventDefault()
    if (isDrawing && canvasRef) {
      // Auto-save signature on touch end
      captureSignature()
    }
    setIsDrawing(false)
  }

  function clearSignature() {
    if (!canvasRef) return
    const ctx = canvasRef.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.width, canvasRef.height)
    setSignature('')
  }

  async function captureSignature() {
    if (!canvasRef) return
    const signatureData = canvasRef.toDataURL('image/png')
    setSignature(signatureData)
    
    // Auto-save signature to local storage as backup
    if (leadId) {
      try {
        localStorage.setItem(`signature_${leadId}`, signatureData)
        setSavingStatus('Signature saved')
        setTimeout(() => setSavingStatus(''), 2000)
      } catch (err) {
        console.error('Error saving signature to localStorage:', err)
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!signatureName.trim()) {
      alert('Please enter your name')
      return
    }

    if (!signature) {
      alert('Please provide your signature')
      return
    }

    if (!selectedColor) {
      alert('Please select a color')
      return
    }

    setIsSigning(true)

    try {
      // Get user's IP address and user agent for compliance
      const ipResponse = await fetch('https://api.ipify.org?format=json')
      const ipData = await ipResponse.json()
      const ipAddress = ipData.ip
      const userAgent = navigator.userAgent

      // Get geolocation if available (with user permission)
      let location = null
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          })
          location = `${position.coords.latitude},${position.coords.longitude}`
        } catch (geoError) {
          console.log('Geolocation not available:', geoError)
        }
      }

      // Use the current contract text (which includes the selected color)
      const finalContractContent = contractText || generateContractContent(lead, selectedColor)

The CUSTOMER understands that resinous coatings are liquid applied floors that cure by a chemical reaction. Certain characteristics can occur with this process, such as "Fisheye's", "Comets", or minor deviations in color batching and the finish. The CUSTOMER understands that PEAK FLOOR COATING can duplicate the colors and can manipulate the flow of the resins to a certain extent, however, cannot guarantee the same movement of pigments showcased in any picture or on any sample board.

The CUSTOMER understands that resinous coatings attract dust particles, air impurities, small insects/bugs and curious animals. Damage from these environmental factors could impair the finish or become embedded in the application.

The CUSTOMER understands that resinous coatings are highly reflective and can reflect environmental colors, which will produce slight color differences to the human eye. Environmental lighting can also cause hue differences based on the type of light emitted from the CUSTOMERS lighting system.

4) UNDERSTANDING THE CHARACTERISTICS OF TOPCOATS

The CUSTOMER waves all rights to yellowing or ambering if an epoxy topcoat, whether it be water based or solvent based, is chosen for the proposed flooring system. Epoxy contains styrene, which will amber naturally and is intensified under U.V. light. PEAK FLOOR COATING doesn't recommend epoxy as a clear coat.

The CUSTOMER understands that topcoats can exhibit a slight 'orange peel' effect, roller marks could be slightly visible, and environmental impurities can affect the final finish. PEAK FLOOR COATING uses the best industry standards to minimize these effects.

The CUSTOMER understands that water-based products, although intended for residential use, can have some odor.

The CUSTOMER understands that most topcoats are UV resistant, however yellowing or ambering of an epoxy floor can occur with over exposure to UV light.

The CUSTOMER understands that solvent-based products emit a strong odor and require pilot lights in appliances to be shut off during the resinous flooring system installation. PEAK FLOOR COATING shall notify the customer before any such solvent-based products are applied. The CUSTOMER agrees that they have, here in, been notified of the flammability of solvent-based products and agrees that shutting down pilot lights is their responsibility and holds PEAK FLOOR COATING not liable for any damages caused by a solvent's flammability.

The CUSTOMER understands that all topcoats are scratch resistant, except any type of wax coating, which has very little scratch resistance. PEAK FLOOR COATING uses the best available products based on the CUSTOMERS intended use to mitigate any scratching. However, the CUSTOMER understands that PEAK FLOOR COATING shall not warranty any scratching or demarcations from misuse or abuse.

5) UNDERSTANDING THE CHARACTERISTICS OF DECORATIVE CONCRETE APPLICATIONS

In Regard to Stains and Dye Applications:

The CUSTOMER agrees that PEAK FLOOR COATING makes no guarantee, express or implied, as to the uniformity of these color applications in relation to the reaction and/or coloring of substrates through the use/application of acid stains, dyes, and water stains, etc. when they are applied to the existing substrate. The CUSTOMER agrees that the condition of the substrate, it's profile, and overall condition, as well as if slabs were poured/finished at different times, can be unknown and could cause color differences throughout the substrate during these applications. Also, if the substrate has nail holes or chips requiring filling/repair, in addition to adhesive and/or previous sealer residues that remain in or on the concrete (whether detectible or invisible), as well as other types of marks and/or foreign matter, will affect the end/finished appearance of the interior or exterior surface to an indeterminable degree during the use/application of acid stains, dyes, and water stains, etc. PEAK FLOOR COATING cannot be held liable and makes no guarantees as to the uniformity and finish of these systems. It is the sole responsibility of the CUSTOMER to ensure that the concrete substrates, which are to serve as the finished floors or exterior surfaces, are adequately protected from contamination and/or damage from other contractors/trades. Should such contamination, marks/gouges/marring/stains of the substrate occur due to failure to guard against, all costs associated with the removal, repair, or correction of them shall be the sole responsibility of the CUSTOMER. It is also understood that stains from petroleum and such chemicals that are spilled onto the surface may leave permanent marks or stains. Additionally, tape shall never be applied directly to the decorative concrete surface. The CUSTOMER understands that tapes contain plasticizers that can fuse to the surface, causing potential defects and delamination, which may leave permanent marks. PEAK FLOOR COATING recommends onsite mock-ups for use/application of acid stains, dyes, and water stains, etc., which would need to be applied to the existing substrate. The CUSTOMER is responsible for the cost of the mock-up applications and shall be payable upfront when the mock-ups are requested.

In Regard to Exterior Coatings:

The CUSTOMER agrees that PEAK FLOOR COATING makes no guarantee, express or implied, that an outdoor coating will be unharmed from the likes of snowplows, general construction equipment, sharp tools, shovels, snow blowers, tire chains, petroleum chemicals, acts of God, your neighbor, the mailman, delivery drivers, etc. and cannot be held liable for any expenses caused by such activities or equipment use.

The CUSTOMER agrees to shut off any sprinkler system for a minimum of 2 days before any exterior coating, at the time of installation, and for a period of 5 days after the installation, in order to allow proper cure time.

The CUSTOMER understands that outdoor coatings require a certain environment for successful application. PEAK FLOOR COATING follows material datasheets to determine when environmental conditions are conducive to application. The CUSTOMER also understands that schedules shall be changed, and deadlines may be missed due to these environmental conditions. The CUSTOMER agrees that PEAK FLOOR COATING makes no guarantee of finishing dates on any outside projects and holds PEAK FLOOR COATING not liable for any costs, material or intangible, associated with environmental delays.

6) SCOPE OF WORK

PEAK FLOOR COATING shall provide all labor and materials and perform all work necessary for the completion of the CUSTOMERS specified floor system according to the contract and industry standards. Any drawings and specifications signed by both CUSTOMER and an PEAK FLOOR COATING representative are hereby made a part of this contract.

PEAK FLOOR COATING shall properly dispose of all containers, masking paper, etc., as well as maintain a clean and orderly working environment; however, we shall not be responsible for those of other contractors that may also be working on the site.

7) BUILDING CONDITIONS

The CUSTOMER agrees that it is their responsibility to provide a weathertight and cleaned out work area before the start date of the project. It is paramount that the area be weathertight and clean as these are liquid applied floors and contaminants will affect the finished product. The CUSTOMER agrees any additional costs in material and labor, that is needed to complete the job due to flatness, damage, cracks, spalling, and general defects in the original concrete slab or flooring space, shall be the CUSTOMER's responsibility and due at the next progress payment. PEAK FLOOR COATING shall do its due diligence at the time of the estimate in order to best estimate any repairs that are necessary for the installation of the specified flooring system.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for and does not warrant water damage from leaking pipes, receptacles, gutters or faulty seals or barriers such as, but not limited to, doors, windows, walls, etc. in the finished floor. In the case of total failure due to these conditions, PEAK FLOOR COATING shall notify the customer and discuss repair / replacement options and the costs associated with the repair of the damaged area.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for the condition of the original concrete surface if it has been previously covered, so that its condition could not be properly assessed; and the removal of previously installed flooring reveals a more severe condition than previously anticipated; PEAK FLOOR COATING may choose to either renegotiate the Contract with the CUSTOMER or terminate the Contract entirely. In the event that termination becomes necessary, the deposit shall be returned, minus the cost of any special ordered products and labor performed.

8) CHANGE ORDERS

Any system changes, repairs, additions, and subtractions to the original scope of work shall warrant a change order with payment due at the next progress payment. The CUSTOMER shall be notified of any additional repairs and material and a change order will need to be approved before work continues. The CUSTOMER agrees to be available for contact during the project in order to approve or deny such change orders.

9) CUSTOMER RESPONSIBILITY DURING INSTALLATION

The CUSTOMER is responsible for protecting the work area once PEAK FLOOR COATING has concluded work for the day. PEAK FLOOR COATING shall mark areas that need to be avoided during the cure process. If any damage occurs to the floor due to humans, animals, vehicles, trash cans, bikes, etc., and the damage is such that it must be fixed in order to fulfill the original scope of work; the CUSTOMER shall be notified with a change order, and upon approval, those areas shall be fixed and billed accordingly with payment due at the next progress payment.

10) CUSTOMER AVAILABILITY

The CUSTOMER agrees to be present and available during all scheduled workdays so that any questions or concerns can be explained and approved. Work shall halt when a change order or the colors need to be approved by the CUSTOMER, which may be needed to move to the next step in the flooring system installation.

The CUSTOMER understands that in the event of untimely communication, 1 hour or more, by the CUSTOMER, PEAK FLOOR COATING has the right to charge their current hourly labor rate for each crew member during this wait time and if communication doesn't happen within that hour, the crew may leave the jobsite for the day and shall return once communication resumes. Any charges shall be assessed and payable at the next progress payment.

11) MOBILIZATION

A mobilization fee of $1,000 for commercial projects and $500 for residential projects shall be assessed for each trip made to the jobsite and the floor and/or the building is not ready to be installed during the scheduled time frame. If the site isn't ready on the scheduled start day, the mobilization fee shall be due immediately and the project shall be moved to the back of the waiting list, unless PEAK FLOOR COATING is given 2 weeks' notice of any scheduling changes. This fee is waived for acts of nature that interfere with the installation of the flooring system.

12) SCHEDULING, MATERIAL DELAYS, AND AVAILABILITY

If some unfortunate delay affects the completion date, PEAK FLOOR COATING shall notify the CUSTOMER and reschedule accordingly.

The CUSTOMER agrees that weather can't be controlled and that completion dates shall change accordingly. PEAK FLOOR COATING shall call the CUSTOMER to reschedule for when conditions are fit to continue the installation of the contracted flooring system.

PEAK FLOOR COATING shall not be held liable for any costs associated with material delays or scheduling delays caused by the acts of Mother Nature. This includes any events held at the CUSTOMERS project location.

The CUSTOMER agrees to disclose all scheduling conflicts at the time of scheduling the project.

The CUSTOMER understands that timing of completion is weather and location dependent and that their completion date may change as a result of weather delays that may cause time over runs on other projects. PEAK FLOOR COATING shall due its due diligence to contact and update the CUSTOMER.

The CUSTOMER agrees that scheduling delays due to material delays are not grounds for breach of contract.

PEAK FLOOR COATING reserves the right to substitute like for like materials if the quoted materials become unavailable.

PEAK FLOOR COATING reserves the right to start any commercial project on the scheduled date of service, whether the project / building property is ready or not, unless notice is given at least 2 weeks in advance.

The CUSTOMER understands that if access to the area being worked on is limited to sections instead of the total job scope due to other trades and restrictions imposed by the CUSTOMER, a change order shall be submitted and PEAK FLOOR COATING shall be entitled to monetary compensation for the schedule changes, unless prior approval was received and reflected in the original proposal.

13) MARKET VOLATILITY

The CUSTOMER agrees that due to market volatility, the price for added work may be different than the current pricing.

PEAK FLOOR COATING has no control over the market availability of products. If a products availability status goes to backorder, unexpectedly, the CUSTOMER cannot hold PEAK FLOOR COATING liable for any schedule changes and delays, nor any cost associated with such delays.

14) PAYMENT TERMS

The CUSTOMER agrees that payment should be made to PEAK FLOOR COATING using cash, check, or an electronic bank draft (ACH/EFT/Money Wire) in the amount of the contract plus any change orders. Credit cards are accepted with a 4% service fee.

The CUSTOMER agrees that any deposit collected toward the proposed job shall be considered an approval of the contract and shall not be refundable.

PEAK FLOOR COATING requires a 50% deposit of the contract price, 30% when we start the job, and the rest is due upon completion of the services described in this contract for residential projects.

PEAK FLOOR COATING requires a 50% deposit of the contract price and shall bill in progress increments for commercial contracts. Final payment is due Net 30 of the project completion date.

If the CUSTOMERS invoice is not paid when due, a $75 late fee plus compounding interest at a rate of 1.5% interest per week shall be added to the invoice and payable on all overdue invoices.

The CUSTOMER agrees that unpaid and overdue invoices/account balances may be secured by a mechanic's lien on the CUSTOMERS location.

The CUSTOMER agrees that if a payment is returned, there shall be a $75 NSF fee plus any applicable fees or administrative costs for the NSF payment.

The CUSTOMER agrees that in addition to any other right or remedy provided by law, if the CUSTOMER fails to pay for the Services when due, PEAK FLOOR COATING has the option to treat such failure to pay as a material breach of the Contract and may cancel this Contract and / or seek legal remedies including but not limited to filing criminal charges for theft of services, attorney's fees, administrative costs, court costs, etc.

15) PEAK FLOOR COATING IS NOT RESPONSIBLE FOR OR SHALL NOT BE HELD LIABLE FOR:

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for premature entry of persons not respecting posted non-entry designators, such as caution tape, cones, and/or signs, etc.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for paint lift or tape residue resulting from the masking materials used on adjacent surfaces during the flooring system installation. PEAK FLOOR COATING attempts to use the best recommended tape for job purposes. If the CUSTOMER prefers the use of any alternate materials, they must be previously identified and made readily available when the work begins at the customer's expense.

PEAK FLOOR COATING shall not be responsible for dust damage arising as a result of the concrete preparation phase of the floor system installation. PEAK FLOOR COATING, follows all industry standards for silica dust extraction during the grinding / preparation process.

PEAK FLOOR COATING shall not be responsible for damage to the coating during installation and for a period of 7 days after installation of the flooring system from persons, actions, or events which are not directly associated with PEAK FLOOR COATING or their assignees.

PEAK FLOOR COATING shall not be responsible for unknown and/or undisclosed substances contained within, or previously added to the existing project surface which is to be coated.

PEAK FLOOR COATING shall not be responsible for conditions and/or damages arising from the overloading of electrical circuits which may occur during, or as a result of, the accomplishment of any work associated with the fulfillment of this contractual agreement and/or any addendums which may or may not be identified herein. PEAK FLOOR COATING's installation includes the use of a generator on site, unless access to the outside is limited or restricted. At which point power needs shall be discussed with the CUSTOMER and the CUSTOMER shall then be responsible for the 220v power requirement and the cost associated with power consumption.

On new construction work PEAK FLOOR COATING shall not be held responsible for the improper pouring/placing/finish work of the slab by independent concrete contractors that will affect the finished decorative surface that is being applied by PEAK FLOOR COATING. It is the sole responsibility of the general contractor, home builder, or property owner to direct the concrete contractor that the concrete slab is to serve as the interior floor or exterior surface and that the concrete surface is to be the finished surface. Upon request, PEAK FLOOR COATING shall provide a written specification as to the way the concrete is to be finished; however, we shall not oversee the finish work of the concrete contractor nor shall PEAK FLOOR COATING be responsible for the finished surface. If the surface is not finished per written specification provided, it is the sole responsibility of the CUSTOMER as to costs associated with correction thereof.

On remodel construction work PEAK FLOOR COATING shall not be held responsible for the improper pouring/placing/finish work of the existing slab by independent concrete contractors that will affect the finished decorative surface that is being applied by PEAK FLOOR COATING.

The CUSTOMER understands and holds the responsibility of complying with the specifications of the installed system and the maintenance of the installed system. This information shall be provided on a case-by-case basis, and spec sheets for products shall be provided upon request. The CUSTOMER understands that if they are not operating within the set specifications of the installed flooring system, damage may occur, and such damage is not covered by the warranty stated in this contract.

16) CANCELLATION

PEAK FLOOR COATING follows the Illinois Consumer Protection Acts right to cancel certain consumer transactions within three business days. Please send verbal and written intentions of cancellation before the 3 days have passed.

17) INSURANCE

PEAK FLOOR COATING shall maintain general liability, commercial auto, and workers compensation insurance. Insurance certificates are available at the CUSTOMERS' request.

18) WARRANTY

Every interior resinous floor system completed by PEAK FLOOR COATING includes a Limited Lifetime Surface Warranty that covers delamination, peeling, cracking, fading, and yellowing (except for clear "epoxy" applications) as long as the recommended system is installed for the environment that the floor occupies. After the first year, the CUSTOMER is responsible for the labor and PEAK FLOOR COATING shall provide the materials at a depreciated rate for any approved warranty claims on interior floors for the life expectancy of the installed floor.

Every exterior resinous/cementitious floor system completed by PEAK FLOOR COATING includes a 1-Year Surface Warranty that covers delamination, peeling, cracking, and yellowing as long as the recommended system is installed for the environment that the floor occupies. This warranty covers defects in materials, in accordance with the manufacturer's warranty, at the time of installation and a 1-year labor guarantee. After the first year, the CUSTOMER is responsible for the labor and materials for any repairs.

PEAK FLOOR COATING shall provide any additional manufacturer warranties to the CUSTOMER. Any manufacturer warranty that covers this flooring installation, in whole or in part, shall supersede the warranty here in stated. It is the CUSTOMERS responsibility to initiate any contact with the manufacturer and the CUSTOMER shall abide by the manufacturer's recommendations / remedies.

This warranty applies to the original CUSTOMER and is non-transferrable, unless prior arrangements have been made in writing with PEAK FLOOR COATING, and the original Service Recipient. The terms of the Limited Lifetime Surface Warranty for interior floors and 1-Year exterior warranty constitutes the entire warranty understanding of the parties, and no other understanding, warranties, collateral, or otherwise, shall be binding unless in writing and signed by both the original CUSTOMER and PEAK FLOOR COATING.

No oral representations or promises are binding and cannot alter or modify the terms of these warranties.

In the event of non-payment by the CUSTOMER at the time of job completion, this Warranty is null and void.

19) WARRANTY EXCLUSIONS

The CUSTOMER understands that any warranty claims are subject to the following exclusions:

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for and does not warrant damage to or dulling of finish caused by prolonged use or CUSTOMER negligence which includes but is not limited to, heavy use, lack of maintenance & care, harsh chemicals used for cleaning, cleaning with abrasive material and/or detergents, or the improper use of pressure washers and scrubbing/buffing machines.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for and does not warrant damage from outside forces, abuse, neglect, and misuse, for example: scratches, damage from impact, spinning tires, flame, mechanical damage to the underlying concrete, or lack of maintenance & cleaning.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for and does not warrant harsh chemicals such as battery acid, brake fluid, paint stripper, industrial solvents, or like products. If a product, such as ReXPro, is installed, the floor will be warranted against chemical damage according to the products technical data sheet.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for and does not warrant moisture related issues, including intrusion, efflorescence, hydrostatic pressure, and swelling of filled joints.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for and does not warrant defects in the concrete/substrate. This includes, but is not limited to heaving, shifting, popping, settling, moisture issues, geo-movement and/or structural foundation movement.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for and does not warrant defects caused by alterations or modifications performed by persons and/or entities other than PEAK FLOOR COATING.

The CUSTOMER agrees that PEAK FLOOR COATING is not responsible for and does not warrant any current and/or future substrate cracks, repaired cracks, and any filled floor joints from ghosting through the coated surface or breaking back apart. PEAK FLOOR COATING follows all industry standards in floor repair.

20) WARRANTY CLAIMS

All warranty claims must be submitted by email to: drew@peakfloorcoating.com and include pictures of the damaged area along with an explanation of the circumstances around warranty claim that occurred. PEAK FLOOR COATING shall schedule a site visit to assess the damage and provide a solution in writing within 2 weeks for the CUSTOMER's review. A service call fee shall be collected at the time of scheduling the warranty claim site visit. Pricing shall be in accordance with PEAK FLOOR COATING current service call pricing and will be stated at the time of scheduling. The service fee is not refundable.

If the damage is determined to be the product or workmanship, the CUSTOMER will be given the warranty remedies in writing for the CUSTOMER's review and subsequent resolution.

21) MEDIA AND ADVERTISING USE

The CUSTOMER shall grant PEAK FLOOR COATING permission to use any photograph, video, or other digital media ("photo") taken during the flooring installation in any and all of its print, digital, or social media publications, including web-based publications, without payment or other consideration to the CUSTOMER. PEAK FLOOR COATING shall not use the CUSTOMERS' last name, business name, address, or phone number in association with any such publications, unless express consent is given by the CUSTOMER.

PEAK FLOOR COATING shall not use any such media at the express request of the CUSTOMER. The CUSTOMER agrees to inform PEAK FLOOR COATING in advance, of the scheduled installation, if they want to request that any media not be used in any type of publication.

22) INDEMNIFICATION FOR SLIP AND FALLS

To the extent permissible by law, the CUSTOMER agrees to indemnify, defend and hold harmless PEAK FLOOR COATING against all liabilities, costs, expenses, damages and losses including but not limited to any direct, indirect or consequential losses, loss of profit, loss of reputation and all interest, penalties and legal costs (calculated on a full indemnity basis) and all other professional costs and expenses suffered or incurred by the CUSTOMER arising out of or in connection with slip and fall lawsuits or claims on any flooring installed by PEAK FLOOR COATING.

23) ENTIRE AGREEMENT

This Agreement contains the entire agreement and understanding among the Parties hereto with respect to the subject matter hereof, and supersedes all prior agreements, understandings, inducements, and conditions, express or implied, oral or written, of any nature whatsoever with respect to the subject matter hereof. The express terms hereof control and supersede any course of performance and/or usage of the trade inconsistent with any of the terms hereof.
      `.trim()

      // Use the current contract text (which includes the selected color)
      const finalContractContent = contractText || generateContractContent(lead, selectedColor)
      
      // Create agreement record
      const { data: agreement, error: agreementError } = await supabase
        .from('agreements')
        .insert({
          lead_id: leadId,
          contract_content: finalContractContent,
          signature_data: signature,
          signed_name: signatureName.trim(),
          signed_at: new Date().toISOString(),
          signed_ip_address: ipAddress,
          signed_user_agent: userAgent,
          signed_location: location,
          status: 'signed'
        })
        .select()
        .single()

      if (agreementError) throw agreementError

      // Update lead with color choice
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          color_choice: selectedColor,
          square_footage: lead.square_footage || lead.estimated_sqft,
          total_price: lead.total_price
        })
        .eq('id', leadId)

      if (updateError) throw updateError

      // Navigate to deposit page
      navigate(`/agreements/deposit?agreementId=${agreement.id}&leadId=${leadId}`)
    } catch (err) {
      console.error('Error submitting agreement:', err)
      alert('Error submitting agreement. Please try again.')
      setIsSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="agreement-page">
        <div className="agreement-container">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="agreement-page">
        <div className="agreement-container">
          <div className="error-message">
            <h2>Error</h2>
            <p>{error || 'Lead not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="agreement-page">
      <header className="agreement-header">
        <div className="header-container">
          <a href="/" className="logo-link">
            <img 
              src="https://github.com/peakleadsgroup/floorcoating/blob/main/images/PeakFloorCoating-1000x250-NoBack.png?raw=true" 
              alt="Peak Floor Coating" 
              className="logo"
            />
          </a>
        </div>
      </header>
      <div className="agreement-container">
        {savingStatus && (
          <div className="save-status">{savingStatus}</div>
        )}
        <h1>Service Agreement</h1>
        
        {/* Project Information Section */}
        <div className="project-info-section">
          <h2>Project Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Customer Name:</label>
              <span>{lead.first_name} {lead.last_name}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{lead.email || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Phone:</label>
              <span>{lead.phone || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Address:</label>
              <span>
                {lead.street_address || 'N/A'}
                {lead.city && `, ${lead.city}`}
                {lead.state && `, ${lead.state}`}
                {lead.zip && ` ${lead.zip}`}
              </span>
            </div>
            <div className="info-item">
              <label>Square Footage:</label>
              <span>{lead.square_footage || lead.estimated_sqft || 'N/A'} sq ft</span>
            </div>
            <div className="info-item">
              <label>Total Price:</label>
              <span>${lead.total_price ? parseFloat(lead.total_price).toFixed(2) : '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Color Selection Section */}
        <div className="color-selection-section">
          <h2>Select Your Color Choice</h2>
          <p className="color-instructions">Click on a color to select it</p>
          <div className="color-grid">
            {COLOR_OPTIONS.map((color) => (
              <div
                key={color.name}
                className={`color-option ${selectedColor === color.name ? 'selected' : ''}`}
                onClick={() => handleColorSelect(color.name)}
              >
                <img src={color.url} alt={color.name} />
                <div className="color-checkbox">
                  {selectedColor === color.name && <span className="checkmark">✓</span>}
                </div>
                <p className="color-name">{color.name}</p>
              </div>
            ))}
          </div>
          {selectedColor && (
            <p className="selected-color-text">Selected: <strong>{selectedColor}</strong></p>
          )}
        </div>

        {/* Contract Section */}
        <div className="contract-section">
          <h2>Contract Terms</h2>
          <div className="contract-content">
            <div 
              className="contract-text" 
              dangerouslySetInnerHTML={{ 
                __html: (contractText || 'Loading contract...')
                  .replace(/\n/g, '<br />')
                  .replace(/(\d+\)\s+[A-Z][^\n]+)/g, '<strong>$1</strong>')
                  .replace(/(PROJECT DETAILS:)/g, '<strong>$1</strong>')
                  .replace(/(RESINOUS AND CEMENTITIOUS FLOORING CONTRACT)/g, '<strong style="font-size: 1.1rem;">$1</strong>')
              }} 
            />
          </div>
        </div>

        {/* Signature Section */}
        <div className="signature-section">
          <h2>Sign Agreement</h2>
          <form onSubmit={handleSubmit}>
            <div className="signature-name-input">
              <label htmlFor="signatureName">Full Name (as it appears on your ID):</label>
              <input
                type="text"
                id="signatureName"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="signature-canvas-container">
              <label>Signature:</label>
              <div className="canvas-wrapper">
                <canvas
                  ref={setCanvasRef}
                  width={600}
                  height={200}
                  className="signature-canvas"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  onTouchStart={handleCanvasTouchStart}
                  onTouchMove={handleCanvasTouchMove}
                  onTouchEnd={handleCanvasTouchEnd}
                />
                <button
                  type="button"
                  className="btn-clear-signature"
                  onClick={clearSignature}
                >
                  Clear
                </button>
              </div>
              <p className="signature-instructions">Please sign above using your mouse or touch screen</p>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-capture-signature"
                onClick={captureSignature}
                disabled={!signatureName.trim()}
              >
                Capture Signature
              </button>
              <button
                type="submit"
                className="btn-submit-agreement"
                disabled={!signature || !signatureName.trim() || !selectedColor || isSigning}
              >
                {isSigning ? 'Submitting...' : 'Sign and Continue to Deposit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

