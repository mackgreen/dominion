#!/bin/env perl

use Image::Magick;

foreach $img ( @ARGV ) {
  my $out = Image::Magick->new;
  $x = $out->Read($img);
  warn "$x" if "$x";
  
  $x = $out->Scale(width => 118, height => 189);
  warn "$x" if "$x";
  $x = $out->Set(quality => 100);
  warn "$x" if "$x";
  $x = $out->Write("jpg:tn_$img");
  warn "$x" if "$x";
}

