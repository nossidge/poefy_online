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

require_relative 'poefy_online/version.rb'

################################################################################

module PoefyOnline

  class SinatraApp < Sinatra::Base

    # Home page, index.html
    get '/' do
      @all_databases  = Poefy.databases.sort
      @poetic_forms   = Poefy.poetic_forms
      @desc_databases = Poefy::Database.list_with_desc.to_h.to_json
      erb :index
    end

    # Generate a poem using the given inputs.
    # Return as a JSON object.
    get '/poem/:database/:poetic_form' do
      poefy = Poefy::PoefyGen.new params['database']
      poem = poefy.poem({ form: params['poetic_form'] })
      JSON (poem || [])
    end

  end

  def self.start_server
    SinatraApp.run!
  end

end

################################################################################
