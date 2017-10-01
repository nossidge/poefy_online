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
      JSON (poefy.poem || [])
    end

  end

  def self.start_server
    PoefyApp.run!
  end

end

################################################################################
