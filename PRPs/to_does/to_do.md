# MUST FINISH BEFORE VACATION
- [+] Fix products management in admin:
    - [+] Padaryti, kad veiktų produktų upload’as
    - [+] Padaryti, kad matytųsi produktų sąrašas admin'e
    - [+] Refactor UI code to eliminate all debugs
    - [+] Perkelti widget konfigūraciją į admin panelę

- [ ] Implement search type of recommendations in the widget:
    - [+] Padaryti chat'o interface
    - [+] Padaryti agentuko rekomendacijas per paiešką
    - [+] Padaryti, kad widget gautų visus produktus į savo užklausos kontekstą
    - [+] Add images
    - [+] Fix the issue of the need to clear the browser data
    - [+] Clean-up code

- [+] Padaryti Integraciją su CVM Platform:
    - [+] Konfigūracija Admin page
    - [+] Pati integracija
    - [+] Test and debug the API calls 

- [+] Implement user profile tab in the widget
    - [+] The widget/chat window should be slightly bigger with 3 icons internaly (chat/profile/real-time context)
    - [+] When pressed on the profile the user_id should be shown, if user id is not available, I should be able to enter it manually
    - [+] When the user_id is available and the CDP returns the profile, the profile should shown beautifully listing all metrics
    - [+] When the user_id is available and the CDP returns the profile, this information should be incorporated as the context for LLM recommendations

- [ ] Prepare project report:
    - [+] Version 1
    
- [+] Padaryti demo puslapį
    - [+] Create PRP
    - [+] Make the version #1
    - [+] Fix URLs
    - [+] Make it in Lithuanian language
    - [+] Fix widget
    - [+] Cleanup code

- [+] Finish project report for the Admin pannel:
    - [+] Fix login page
    - [+] Add login screan-shot
    - [+] Add the screanshot for .csv file, for upload, and edit functionalities
    - [+] Add the sreanshot for user management
    - [+] Add the screanshots for Porta futuri widget management
    - [+] Add the screanshot for integrations management
    - [+] Enable product comments upload
        - [+] Create the PRP
        - [+] Run the PRP
        - [+] Debug until it works

- [+] Finish project report for demo site
    - [+] Fix the landing page
        - [+] fix the button
        - [+] fix recommendations
        - [+] fix category icons
        - [+] make the chat icon not transparent
    - [+] Fix product categories
        - [+] Make sure the menu has all categories in place
    - [+] Fix product preview
        - [+] Create PRP
        - [+] Add product features
        - [+] Add product Comments
        - [+] Debug the lithuanian language
        - [+] Debug the missing images
    - [+] Fill in the project report

- [ ] Finish the widget report examples:

    - [+] Fix UI of chat
        - [+] Do not require to enter user id on the load instead ask it only when pressed on the prifile icon
        - [+] Make a much more beautiful UI for the customer profile in the chat, aim for the design which would be inspired by an openai.com
        - [+] By default speak in the language which is set for the page
        - [+] Fix CVM Platform integration bugs
            - [+] Fix API integration
            - [+] Fix showed profile fields
            - [+] Make sure it's beautiful
            - [+] Cleanup the widget code
    
    - [+] Fix chat recommendations
        - [+] Refactor to use Gemini
        - [+] Make sure that the full product info is in prompt
        - [+] Make sure that the full customer profile is in prompt
        - [+] Make sure that the opening question opens with the language of the website
        - [+] Make sure that the recommendations are relevant
        - [+] Make sure that the chat asks relevant followup questions
        - [+] Make sure that the products and their prices are comming from the catalogue
        - [+] Fix issue with missing recommendations

    - [ ] Add real-time user context to chat
        - [+] Prepare PRP
        - [+] Refactor, kad URLs būtų su produktų pavadinimais
        - [+] Padaryti loginimą userio veiksmų realiu laiku
        - [+] Praplėsti widget, kad useris realiu laiku matytų savo kontekstą, t.y. kokius pageus browsino
        - [] Fix UI for URLS
        - [] Fix UI for intent detection
        - [] Make intent detection better
        - [] Add this context to the recommendations
        - [] Fix URL links in recommendations
        - [] Add capability to dismiss offers for the clients
        - [] Add capability to change the chat size, make it bigger or smaller
        - [] Make tabs more beautiful
    
    
- [ ] Padaryti landing page’ą




# OUT OF SCOPE

## Better recommendations
- [ ] Praplėsti widget’ą, kad jis automatiškai inicijuotų Pokalbį su usqeriu ir siūlytų savo rekomendacijas


## DEPLOYMENT
- [ ] Split the project into multiple ones
- [ ] Surasti budą padeployinti  Landing, Widget Serving and Admin part


## INTEGRATION WITH EXACASTER CVM PLATFORM
    - [ ] Paruošti duomenų failą pritaikytą demo
    - [ ] Užkelti failą į Core
    - [ ] Atiduoti duomenis per API
    - [ ] Perkonfigūruoti duomenis

## PORTA FUTURI ADMIN
- [ ] FIX THE ISSUE WITH THE ADMIN NOW IT IS USING THE TEMPORARY SOLUTION
- [ ] Add a landing page for the admin panel
- [ ] Make sure that you can reupload products without duplicates, etc.
- [ ] Create the organization definition in the  management flow
- [ ] Create the flow for account creation
- [ ] Create the flow for organization creation
- [ ] Create the flow for the password reminders
- [ ] Create the team definition
- [ ] Create the flow to add/remove team members
- [ ] Create roles for the team members
- [ ] Add prompts management

## PORTA FUTURI BACKEND

## PORTA FUTURI WIDGET
- [ ] Make a more beautiful design.
- [ ] Cleanup the code

## PORTA FUTURI DEMO E-COM SITE


## PORTA FUTURI DEMO E-COM SITE



