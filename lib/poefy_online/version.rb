#!/usr/bin/env ruby
# Encoding: UTF-8

module PoefyOnline

  ##
  # The number of the current version.
  #
  def self.version_number
    major = 0
    minor = 0
    tiny  = 1
    pre   = 'pre'

    Gem::Version.new [major, minor, tiny, pre].compact.join('.')
  end

  ##
  # The date of the current version.
  #
  def self.version_date
    '2017-09-10'
  end
end
