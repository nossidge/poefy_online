require 'bundler/gem_tasks'
require 'rspec/core/rake_task'

RSpec::Core::RakeTask.new(:spec) do |t|
  t.verbose = false
end
task :test => :spec

desc "Open poefy server"
task :server do
  require_relative 'lib/poefy_online.rb'
  PoefyOnline::start_server
end
