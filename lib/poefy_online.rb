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

# Extend the Poefy::Database postgres connection.
module Poefy
  class Database

    # Details for the database connection.
    def self.connection
      PG.connect( ENV['DATABASE_URL'] )
    end

    # Open a class-wide connection, execute a query.
    def self.single_exec! sql, sql_args = nil
      output = nil
      begin
        @@con ||= Database::connection
        output = if sql_args
          @@con.exec(sql, [*sql_args]).values
        else
          @@con.exec(sql).values
        end
      end
      output
    end

    # Open a connection to the database.
    def open_connection
      @db ||= Database::connection
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
      @poetic_forms   = Poefy.poetic_forms
      @desc_databases = Poefy::Database.list_with_desc.to_h.to_json
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
      transform = params['transform']

      # Create options hash.
      options = {}
      options[:form]      = form      if form
      options[:rhyme]     = rhyme     if rhyme
      options[:indent]    = indent    if indent
      options[:syllable]  = syllable  if syllable
      options[:regex]     = regex     if regex
      options[:acrostic]  = acrostic  if acrostic
      options[:transform] = transform if transform

      # Return poem as a JSON object.
      poefy = Poefy::Poem.new(corpus, options)
      poem = poefy.poem
      poefy.close
      JSON (poem || [])
    end

  end

  def self.start_server
    PoefyApp.run!
  end

end

################################################################################
