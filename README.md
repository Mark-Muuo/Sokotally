SokoTally
Overview

SokoTally is a web-based, AI-powered bookkeeping system designed to help informal vegetable vendors in Kenya manage their daily business transactions. The system allows users to record sales, expenses, debts, and loans using conversational text in either English or Kiswahili. It automatically extracts structured financial data and generates summaries to support better business decision-making.

SokoTally aims to replace unreliable manual record-keeping methods such as memory and notebooks with a simple, accessible, and intelligent digital solution.

Problem Statement

Many informal vegetable vendors do not maintain structured financial records. They rely on memory or paper notes, making it difficult to track profits, expenses, and outstanding debts. Existing digital solutions are often complex, not localized, or designed for formal businesses rather than informal traders.

SokoTally addresses this gap by providing a simple, multilingual, AI-powered bookkeeping platform tailored specifically for informal vendors.

Key Features

User registration and secure login

Conversational transaction entry (English & Kiswahili)

Automatic classification of:

Sales

Expenses

Debts (customers owe me)

Loans (I owe others)

Daily, weekly, and monthly financial summaries

Records grouped by date

Secure data storage

Mobile-friendly interface

System Architecture

Frontend:

Built using HTML, CSS, and JavaScript

Deployed on Vercel

Backend:

Built using Node.js and Express

Hosted on Render

Database:

Relational database for storing user and transaction data

AI Integration:

Large Language Model (LLM) API for natural language processing

How It Works

User registers and logs into the system.

User enters a transaction in conversational text, e.g.:

“Nimeuza nyanya 500 leo”

“Mama Asha ananidai 200 ya vitunguu”

The backend sends the text to the AI model.

The model extracts:

Transaction type

Amount

Date

Item

Person involved

Structured data is stored in the database.

The system updates financial summaries automatically.
