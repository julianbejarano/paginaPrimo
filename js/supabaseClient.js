window.supabaseDemo = window.supabaseDemo || {};

const supabaseUrl = 'https://yegalrvzgllxlzllsdba.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZ2FscnZ6Z2xseGx6bGxzZGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwODEyMjYsImV4cCI6MjEwNzY1NzIyNn0.P6_tlhnf6-2OQ4d3XqSJW1X6xr9mwIvs7eiJvijbrLk';

const { createClient } = supabase;
const db = createClient(supabaseUrl, supabaseAnonKey);