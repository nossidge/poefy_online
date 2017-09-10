#!/usr/bin/env ruby
# Encoding: UTF-8

################################################################################
# Web interface for the poefy gem.
# Start the server by running `rackup`.
################################################################################

require 'poefy'
require 'sinatra'
require 'erb'

require_relative 'poefy_online/version.rb'

################################################################################

module PoefyOnline

  class SinatraApp < Sinatra::Base

    # Home page, index.html
    get '/' do

      # ToDo: These should have nicer methods, like the below:
      # @poetic_forms = Poefy.all_poetic_forms
      # @all_databases = Poefy.all_databases
      @poetic_forms = Poefy::PoeticForms::POETIC_FORMS.keys.reject { |i| i == :default }
      @all_databases = Poefy.all_databases - ['test']

      # ToDo: This shouldn't be hard-coded.
      # There should be some configuration option in the base poefy gem.
      @desc_databases = {
        "dickinson"   => "Emily Dickinson",
        "shakespeare" => "Shakespeare's sonnets",
        "spoke"       => "English As She Is Spoke",
        "therese"     => "St. Thérèse of Lisieux",
        "whitman"     => "Walt Whitman, Leaves of Grass"
      }.to_json

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

end

################################################################################
