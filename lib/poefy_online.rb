#!/usr/bin/env ruby
# Encoding: UTF-8

################################################################################
# Web interface for the poefy gem.
# Start the server by running `rackup`.
################################################################################

require 'sinatra'
require 'erb'
require 'poefy'
require 'poefy/pg'

################################################################################

# Alter the Poefy::Database postgres connection.
module Poefy
  class Database
    def self.connection
      PG.connect( ENV['DATABASE_URL'] )
    end
  end
end

################################################################################

# Create corpora from the text files included with the repository.
# Exclude all lines which do not contain lowercase letters.
def make_db database, textfile, description
  file  = Poefy.root + '/data/' + textfile
  input = File.readlines(file).keep_if { |i| i =~ /[a-z]/ }
  poefy = Poefy::Poem.new database
  poefy.make_database! input, description
  poefy.close
end

[
  [
    'shakespeare',
    'shakespeare_sonnets.txt',
    "Shakespeare's sonnets"
  ],[
    'therese',
    'st_therese_of_lisieux.txt',
    "St. Thérèse of Lisieux"
  ],[
    'whitman',
    'whitman_leaves.txt',
    "Walt Whitman, Leaves of Grass"
  ],[
    'dickinson',
    'emily_dickinson.txt',
    "Emily Dickinson"
  ],[
    'spoke',
    'english_as_she_is_spoke.txt',
    "English As She Is Spoke"
  ]
].each do |i|
  make_db(*i)
end

################################################################################

module PoefyOnline

  class PoefyApp < Sinatra::Base

    # Home page, index.html
    get '/' do
      @all_databases  = Poefy.databases.sort
      @poetic_forms   = Poefy::PoeticForms::POETIC_FORMS
      @poetic_forms.delete(:default)
      @desc_databases = Poefy::Database.list_with_desc
      erb :index
    end

    # Generate a poem using the given inputs.
    get '/poem' do
      corpus    = params['corpus']
      form      = params['form']
      rhyme     = params['rhyme']
      indent    = params['indent']
      syllable  = params['syllable']
      regex     = params['regex']
      acrostic  = params['acrostic']
      proper    = !!params['proper']
      capital   = !!params['capital']

      # Create options hash.
      options = {}
      options[:form]      = form      if form
      options[:rhyme]     = rhyme     if rhyme
      options[:indent]    = indent    if indent
      options[:syllable]  = syllable  if syllable
      options[:regex]     = regex     if regex
      options[:acrostic]  = acrostic  if acrostic
      options[:proper]    = proper

      # Add the capitalisation transfom.
      if capital
        options[:transform] = proc do |line|
          regex = /[a-zA-Z]/
          line[regex] = line[regex].upcase
          line
        end
      end

      # Create a new Poefy::Poem object.
      poefy = Poefy::Poem.new(corpus)

      # Create a poem and catch any errors.
      poem = begin
        poefy.poem(options)
      rescue Poefy::Error => e
        [e.exception]
      ensure
        poefy.close
      end

      # Return poem as a JSON object.
      JSON (poem || [])
    end

  end

  def self.start_server
    PoefyApp.run!
  end

end

################################################################################
