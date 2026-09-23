# Coastal side Wanderer

Build a beautiful, modern, responsive full-stack web application called COASTWISE AI with the tagline “Less planning. More exploring.”

It is an AI-powered travel planner specifically for Coastal Karnataka, using RAG + LLM + vector database + rule-based recommendation and route optimization.

Main Goal

The user enters:

- Starting location

- Destination(s)

- Number of days

- Number of people

- Total budget

- Travel dates

- Travel style: budget/comfortable/luxury/backpacking

- Interests: beaches, temples, food, adventure, culture, photography, trekking, wildlife, etc.

- Vegetarian/non-vegetarian

- Transport preference

- Hotel preference

- Activity intensity

Then the AI generates a complete personalized itinerary.

Coastal Karnataka Coverage

Focus on:

Udupi, Mangaluru, Manipal, Kundapura, Malpe, Kaup, Maravanthe, Mulki, Surathkal, Panambur, Tannirbhavi, Sasihithlu, Someshwara, St. Mary's Island, Murudeshwar, Honnavar, Kumta, Gokarna, Karwar, Yana and relevant nearby destinations.

AI Architecture

Implement:

User Input → Query Processing → RAG Retrieval → Coastal Karnataka Knowledge Base → Vector Search → Rule-Based Ranking → Budget/Route Optimization → LLM → Personalized Itinerary

The LLM must use retrieved knowledge instead of inventing information.

Use:

- React + TypeScript

- Tailwind CSS + shadcn/ui

- Supabase/PostgreSQL

- pgvector

- OpenAI-compatible LLM/embedding API

- PWA for offline functionality

Keep API keys in environment variables.

Knowledge Base

Create structured datasets for:

- Destinations

- Beaches

- Temples

- Hotels/stays

- Restaurants

- Local cuisine

- Adventure/sports

- Transport

- Attractions

Use legally usable public/open data and curated project datasets, NOT “all internet data.” Create sample Coastal Karnataka CSV/JSON data so the demo works immediately.

Support an admin data-ingestion system:

Upload CSV/JSON/PDF/TXT → Clean → Chunk → Add metadata → Generate embeddings → Store in PostgreSQL + pgvector

Every record should retain a source/reference where possible.

Itinerary

Generate a day-by-day plan containing:

- Morning/afternoon/evening activities

- Places to visit

- Travel time

- Distance

- Suggested duration

- Restaurants and local food

- Hotel recommendations

- Activities/sports

- Estimated cost

Avoid unnecessary backtracking using route optimization.

Add “Places on the Way” to recommend attractions, restaurants, viewpoints and activities requiring minimal detours.

Budget

Calculate:

- Transport

- Hotels

- Food

- Activities

- Entry fees

- Miscellaneous

Show:

Total cost + cost/person + cost/day + remaining budget

If over budget, automatically suggest cheaper alternatives.

Travel

Create sections for:

Bus | Train | Flight | Taxi | Rental

Show approximate cost/time when live data isn't available.

Create integration-ready Book Bus / Book Train / Book Flight / Book Stay buttons. Never fake live availability.

Recommendations

Include:

- AI hotel recommendations

- Restaurant recommendations

- Local Coastal Karnataka cuisine

- Sports/adventure activities

- Hidden gems

- Packing assistant

- Weather-aware planning when a real weather API is connected

AI Chat Assistant

Add “CoastWise Assistant” where users can ask:

“Make this trip cheaper.”

“Add more beaches.”

“Remove temples.”

“Add water sports.”

“Give me vegetarian restaurants.”

“Reduce travel time.”

“Add one more day.”

The chatbot must use the same RAG knowledge base.

Offline Mode

Make the website a PWA.

Allow users to click “Save for Offline” and access their saved itinerary without internet using service workers + IndexedDB/local caching.

Offline trip should contain:

- Itinerary

- Places

- Hotels

- Restaurants

- Activities

- Estimated costs

- Cached route information

Clearly state that live prices, weather, traffic and ticket availability require internet.

Feedback

After the trip, allow users to give:

- 1–5 star rating

- Destination feedback

- Hotel feedback

- Restaurant feedback

- Activity feedback

- Itinerary feedback

- Comments

- “Was this itinerary useful?” Yes/Partially/No

Store feedback and use it as a controlled recommendation-ranking signal, not as automatic LLM retraining.

User Dashboard

Include:

- Plan New Trip

- My Trips

- Saved Offline Trips

- Favorites

- Past Trips

- Feedback

Admin Dashboard

Include:

- Dataset upload

- Knowledge-base management

- Embedding generation

- Destinations/hotels/restaurants/activity management

- Feedback analytics

- Popular destinations

- Popular cuisine/activity

UI/UX

Make it feel like a premium travel startup, not a college-project dashboard.

Style:

- Coastal Karnataka / Arabian Sea aesthetic

- Cream/sand background

- Ocean blue

- Muted green

- Earthy accents

- Beautiful photography

- Elegant typography

- Rounded cards

- Smooth animations

- Interactive map

- Mobile-first responsive design

Homepage hero:

“EXPLORE COASTAL KARNATAKA.

WITHOUT THE PLANNING HEADACHE.”

CTA: PLAN MY TRIP

Demo

Make the application functional in demo mode without paid APIs.

Demo:

Bengaluru → Udupi + Mangaluru

3 days | 2 people | ₹10,000

Interests: Beaches + Food + Culture

Generate a realistic demonstration itinerary using the curated Coastal Karnataka knowledge base.

Technical Project Page

Add a “How It Works” page explaining:

RAG → Embeddings → Vector Database → Rule-Based Algorithm → Route/Budget Optimization → LLM → Itinerary → Feedback

Also show a clean architecture diagram.

Important

Do NOT fabricate hotel prices, ratings, transport schedules, opening hours or ticket availability.

Clearly label information as Approximate, Live, or Unavailable.

Build a functional MVP, not just a UI mockup. Make the architecture modular so real Maps, Weather, Bus, Flight, Hotel and Restaurant APIs can be connected later.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4108c078-2690-4dd5-8d81-b61303f0c6da).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
